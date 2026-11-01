import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";

const mockCreateError = vi.fn(
  (opts: { statusCode: number; statusMessage?: string }) => {
    const err = new Error(opts.statusMessage ?? "Error") as Error & {
      statusCode?: number;
    };
    err.statusCode = opts.statusCode;
    return err;
  },
);
const mockGetHeader = vi.fn();
const mockGetQuery = vi.fn();
const { runtimeConfig, NUXT_BASE_CONFIG } = vi.hoisted(() => {
  const NUXT_BASE_CONFIG = {
    app: { baseURL: "/", buildAssetsDir: "/_nuxt/", cdnURL: "" },
    public: {},
  };
  return {
    NUXT_BASE_CONFIG,
    runtimeConfig: { value: { ...NUXT_BASE_CONFIG } as Record<string, unknown> },
  };
});

vi.stubGlobal("defineEventHandler", (fn: (event: unknown) => unknown) => fn);
vi.stubGlobal("createError", mockCreateError);
vi.stubGlobal("getHeader", mockGetHeader);
vi.stubGlobal("getQuery", mockGetQuery);
vi.stubGlobal("useRuntimeConfig", () => runtimeConfig.value);
mockNuxtImport("useRuntimeConfig", () => () => runtimeConfig.value);

const mockHouseholdFind = vi.fn();
const mockHouseholdUpdateOne = vi.fn();
const mockTaskFind = vi.fn();
const mockUserFind = vi.fn();
const mockNotificationInsertMany = vi.fn();
const mockDeviceFind = vi.fn();
const mockDeviceDeleteMany = vi.fn();
const mockSendPush = vi.fn();

vi.mock("#server/models/Household", () => ({
  Household: { find: mockHouseholdFind, updateOne: mockHouseholdUpdateOne },
}));
vi.mock("#server/models/Task", () => ({ Task: { find: mockTaskFind } }));
vi.mock("#server/models/User", () => ({ User: { find: mockUserFind } }));
vi.mock("#server/models/AppNotification", () => ({
  AppNotification: { insertMany: mockNotificationInsertMany },
}));
vi.mock("#server/models/DeviceToken", () => ({
  DeviceToken: { find: mockDeviceFind, deleteMany: mockDeviceDeleteMany },
}));
vi.mock("#server/utils/fcm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("#server/utils/fcm")>()),
  sendPush: mockSendPush,
}));

const FRIDAY = "2026-11-06T09:00:00Z";
const HH = { _id: "hh1", weekStartDay: "monday", timezone: "Europe/Madrid" };

function lean<T>(value: T) {
  return { lean: () => Promise.resolve(value) };
}

function user(id: string, locale?: string) {
  return { _id: { toString: () => id }, locale };
}

function setup({
  households = [HH],
  tasks = [
    { recurring: false, done: false, assignee: "u1" },
    { recurring: false, done: false, assignee: null },
  ] as unknown[],
  users = [user("u1", "es"), user("u2")],
  devices = [
    { userId: "u1", token: "tok-u1" },
    { userId: "u2", token: "tok-u2" },
  ],
} = {}) {
  mockHouseholdFind.mockReturnValue(lean(households));
  mockHouseholdUpdateOne.mockResolvedValue({ modifiedCount: 1 });
  mockTaskFind.mockReturnValue(lean(tasks));
  mockUserFind.mockReturnValue(lean(users));
  mockDeviceFind.mockReturnValue(lean(devices));
  mockSendPush.mockResolvedValue("sent");
}

async function run(now: string | undefined = FRIDAY) {
  mockGetQuery.mockReturnValue(now ? { now } : {});
  const { default: handler } = await import(
    "#server/api/cron/week-reminders.get"
  );
  return (handler as Function)({});
}

beforeEach(() => {
  vi.clearAllMocks();
  runtimeConfig.value = {
    ...NUXT_BASE_CONFIG,
    cronSecret: "s3cret",
    fcmProjectId: "proj",
    fcmClientEmail: "svc@proj.iam.gserviceaccount.com",
    fcmPrivateKey: "key",
  };
  mockGetHeader.mockReturnValue("Bearer s3cret");
  setup();
});

describe("cron week-reminders", () => {
  it("rejects a missing or wrong secret", async () => {
    mockGetHeader.mockReturnValue("Bearer nope");
    await expect(run()).rejects.toMatchObject({ statusCode: 401 });
    runtimeConfig.value.cronSecret = "";
    mockGetHeader.mockReturnValue("Bearer ");
    await expect(run()).rejects.toMatchObject({ statusCode: 401 });
    expect(mockHouseholdFind).not.toHaveBeenCalled();
  });

  it("rejects an invalid now", async () => {
    await expect(run("nope")).rejects.toMatchObject({ statusCode: 400 });
  });

  it("does nothing outside the reminder day", async () => {
    const result = await run("2026-11-05T09:00:00Z");
    expect(result).toEqual({ ok: true, notified: 0 });
    expect(mockHouseholdUpdateOne).not.toHaveBeenCalled();
  });

  it("uses the real clock when no now is given", async () => {
    vi.useFakeTimers({ now: new Date(FRIDAY), toFake: ["Date"] });
    try {
      expect(await run(undefined)).toEqual({ ok: true, notified: 2 });
    } finally {
      vi.useRealTimers();
    }
  });

  it("creates one notification per member and pushes only to their devices", async () => {
    const result = await run();
    expect(result).toEqual({ ok: true, notified: 2 });
    expect(mockHouseholdUpdateOne).toHaveBeenCalledWith(
      { _id: "hh1", lastReminderWeek: { $ne: "2026-11-02" } },
      { lastReminderWeek: "2026-11-02" },
    );
    expect(mockUserFind).toHaveBeenCalledWith({
      householdId: "hh1",
      status: "active",
    });
    expect(mockNotificationInsertMany).toHaveBeenCalledWith([
      {
        householdId: "hh1",
        userId: "u1",
        type: "week-reminder",
        data: { mine: 1, unassigned: 1 },
      },
      {
        householdId: "hh1",
        userId: "u2",
        type: "week-reminder",
        data: { mine: 0, unassigned: 1 },
      },
    ]);
    expect(mockDeviceFind).toHaveBeenCalledWith({
      householdId: "hh1",
      userId: { $in: ["u1", "u2"] },
    });
    expect(mockSendPush).toHaveBeenCalledWith(
      runtimeConfig.value,
      "tok-u1",
      {
        title: "Quedan 2 días de semana",
        body: "1 tarea tuya pendiente · 1 tarea sin asignar",
        data: { route: "/todos" },
      },
    );
    expect(mockSendPush).toHaveBeenCalledWith(
      runtimeConfig.value,
      "tok-u2",
      expect.objectContaining({ body: "1 unassigned task" }),
    );
  });

  it("skips a household already reminded this week", async () => {
    mockHouseholdUpdateOne.mockResolvedValue({ modifiedCount: 0 });
    expect(await run()).toEqual({ ok: true, notified: 0 });
    expect(mockTaskFind).not.toHaveBeenCalled();
  });

  it("uses the household week start and default timezone", async () => {
    setup({ households: [{ _id: "hh1" } as typeof HH] });
    expect(await run()).toEqual({ ok: true, notified: 2 });
    setup({
      households: [{ ...HH, weekStartDay: "sunday" }],
    });
    expect(await run()).toEqual({ ok: true, notified: 0 });
  });

  it("serialises doneAt for recurring tasks", async () => {
    setup({
      tasks: [
        {
          recurring: true,
          done: true,
          doneAt: new Date("2026-10-27T10:00:00Z"),
          repeatEvery: 1,
          repeatUnit: "week",
          assignee: "u2",
        },
      ],
    });
    await run();
    expect(mockNotificationInsertMany).toHaveBeenCalledWith([
      expect.objectContaining({ userId: "u2", data: { mine: 1, unassigned: 0 } }),
    ]);
  });

  it("does not notify when nothing is pending", async () => {
    setup({ tasks: [{ recurring: false, done: true, assignee: "u1" }] });
    expect(await run()).toEqual({ ok: true, notified: 0 });
    expect(mockNotificationInsertMany).not.toHaveBeenCalled();
  });

  it("deletes tokens that FCM reports as unregistered", async () => {
    mockSendPush.mockImplementation(async (_c, token) =>
      token === "tok-u2" ? "unregistered" : "sent",
    );
    await run();
    expect(mockDeviceDeleteMany).toHaveBeenCalledWith({
      token: { $in: ["tok-u2"] },
    });
  });

  it("ignores devices of members without a reminder", async () => {
    setup({
      devices: [{ userId: "u3", token: "tok-u3" }],
    });
    await run();
    expect(mockSendPush).not.toHaveBeenCalled();
    expect(mockDeviceDeleteMany).not.toHaveBeenCalled();
  });

  it("still creates notifications when FCM is not configured", async () => {
    runtimeConfig.value.fcmPrivateKey = "";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await run()).toEqual({ ok: true, notified: 2 });
    expect(mockNotificationInsertMany).toHaveBeenCalled();
    expect(mockDeviceFind).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("still succeeds when pushing fails", async () => {
    mockDeviceFind.mockReturnValue({
      lean: () => Promise.reject(new Error("db down")),
    });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await run()).toEqual({ ok: true, notified: 2 });
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
