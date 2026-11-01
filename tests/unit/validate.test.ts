import { describe, it, expect } from "vitest";
import {
  inventorySchema,
  shoppingSchema,
  taskSchema,
} from "../../server/utils/validate";

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

describe("shoppingSchema", () => {
  it("accepts a category and trims the note", () => {
    const result = shoppingSchema.safeParse({
      name: "Shampoo",
      cat: "hygiene",
      note: "  2-in-1 ",
    });
    expect(result.success && result.data.note).toBe("2-in-1");
  });

  it("accepts a null category", () => {
    expect(
      shoppingSchema.safeParse({ name: "Shampoo", cat: null }).success,
    ).toBe(true);
  });

  it.each([
    ["an unknown category", { cat: "garden" }],
    ["a note over 200 characters", { note: "x".repeat(201) }],
  ])("rejects %s", (_label, extra) => {
    expect(
      shoppingSchema.safeParse({ name: "Shampoo", ...extra }).success,
    ).toBe(false);
  });
});
