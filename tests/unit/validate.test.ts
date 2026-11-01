import { describe, it, expect } from "vitest";
import { inventorySchema, taskSchema } from "../../server/utils/validate";

describe("inventorySchema", () => {
  it.each(["food", "cleaning", "hygiene", "misc"])("accepts cat %s", (cat) => {
    expect(inventorySchema.safeParse({ name: "Soap", cat }).success).toBe(true);
  });

  it("rejects an unknown cat", () => {
    expect(
      inventorySchema.safeParse({ name: "Soap", cat: "garden" }).success,
    ).toBe(false);
  });
});

describe("taskSchema", () => {
  it("accepts a custom interval and an ISO doneAt", () => {
    const result = taskSchema.safeParse({
      title: "Water plants",
      recurring: true,
      repeatEvery: 3,
      repeatUnit: "day",
      doneAt: "2026-11-01T10:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ["a zero interval", { repeatEvery: 0 }],
    ["a fractional interval", { repeatEvery: 1.5 }],
    ["an unknown unit", { repeatUnit: "year" }],
    ["a non-ISO doneAt", { doneAt: "yesterday" }],
  ])("rejects %s", (_label, extra) => {
    expect(
      taskSchema.safeParse({ title: "Water plants", ...extra }).success,
    ).toBe(false);
  });
});
