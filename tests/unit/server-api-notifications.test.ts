import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReadBody = vi.fn();
const mockCreateError = vi.fn(
  (opts: { statusCode: number; statusMessage?: string }) => {
    const err = new Error(opts.statusMessage ?? "Error") as Error & {
      statusCode?: number;
    };
    err.statusCode = opts.statusCode;
    return err;
  },
);

vi.stubGlobal("defineEventHandler", (fn: (event: unknown) => unknown) => fn);
vi.stubGlobal("readBody", mockReadBody);
vi.stubGlobal("createError", mockCreateError);

const mockNotificationFind = vi.fn();
const mockNotificationUpdateMany = vi.fn();
const mockNotificationDeleteMany = vi.fn();
const mockDeviceFindOneAndUpdate = vi.fn();
const mockDeviceDeleteOne = vi.fn();

vi.mock("#server/models/AppNotification", () => ({
  AppNotification: {
    find: mockNotificationFind,
    updateMany: mockNotificationUpdateMany,
    deleteMany: mockNotificationDeleteMany,
  },
}));
vi.mock("#server/models/DeviceToken", () => ({
  DeviceToken: {
    findOneAndUpdate: mockDeviceFindOneAndUpdate,
    deleteOne: mockDeviceDeleteOne,
  },
}));

function mockEvent() {
  return { context: { user: { userId: "u1", householdId: "hh1" } } };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("notifications.get", () => {
  it("returns the caller's latest 20 notifications", async () => {
    const limit = vi.fn(() => ({
      lean: () =>
        Promise.resolve([
          { _id: { toHexString: () => "n1" }, type: "week-reminder" },
        ]),
    }));
    const sort = vi.fn(() => ({ limit }));
    mockNotificationFind.mockReturnValue({ sort });
    const { default: handler } = await import("#server/api/notifications.get");
    const result = await (handler as Function)(mockEvent());
    expect(mockNotificationFind).toHaveBeenCalledWith({
      userId: "u1",
      householdId: "hh1",
    });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(limit).toHaveBeenCalledWith(20);
    expect(result).toEqual([{ id: "n1", type: "week-reminder" }]);
  });
});

describe("notifications.patch", () => {
  it("marks only the caller's unread notifications as read", async () => {
    const { default: handler } = await import(
      "#server/api/notifications.patch"
    );
    const result = await (handler as Function)(mockEvent());
    expect(mockNotificationUpdateMany).toHaveBeenCalledWith(
      { userId: "u1", householdId: "hh1", readAt: null },
      { readAt: expect.any(Date) },
    );
    expect(result).toEqual({ ok: true });
  });
});

describe("notifications.delete", () => {
  it("deletes only the caller's notifications", async () => {
    const { default: handler } = await import(
      "#server/api/notifications.delete"
    );
    const result = await (handler as Function)(mockEvent());
    expect(mockNotificationDeleteMany).toHaveBeenCalledWith({
      userId: "u1",
      householdId: "hh1",
    });
    expect(result).toEqual({ ok: true });
  });
});

describe("push/devices.post", () => {
  it("upserts the token for the authenticated user", async () => {
    mockReadBody.mockResolvedValue({ token: "tok", userId: "attacker" });
    const { default: handler } = await import(
      "#server/api/push/devices.post"
    );
    const result = await (handler as Function)(mockEvent());
    expect(mockDeviceFindOneAndUpdate).toHaveBeenCalledWith(
      { token: "tok" },
      { token: "tok", userId: "u1", householdId: "hh1", platform: "android" },
      { upsert: true },
    );
    expect(result).toEqual({ ok: true });
  });

  it("rejects a missing token", async () => {
    mockReadBody.mockResolvedValue({});
    const { default: handler } = await import(
      "#server/api/push/devices.post"
    );
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(mockDeviceFindOneAndUpdate).not.toHaveBeenCalled();
  });
});

describe("push/devices.delete", () => {
  it("deletes the token only for the caller", async () => {
    mockReadBody.mockResolvedValue({ token: "tok" });
    const { default: handler } = await import(
      "#server/api/push/devices.delete"
    );
    const result = await (handler as Function)(mockEvent());
    expect(mockDeviceDeleteOne).toHaveBeenCalledWith({
      token: "tok",
      userId: "u1",
    });
    expect(result).toEqual({ ok: true });
  });
});
