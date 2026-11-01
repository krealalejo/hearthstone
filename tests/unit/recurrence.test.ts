import { describe, it, expect } from "vitest";
import { periodStart, nextDueDate, isRecurrenceDue } from "~/utils/recurrence";

function local(y: number, m: number, d: number, h = 0, min = 0) {
  return new Date(y, m - 1, d, h, min);
}

describe("periodStart", () => {
  it.each([
    ["day", "monday", local(2026, 11, 4, 15, 30), local(2026, 11, 4)],
    ["week", "monday", local(2026, 11, 4, 15), local(2026, 11, 2)],
    ["week", "monday", local(2026, 11, 1, 9), local(2026, 10, 26)],
    ["week", "sunday", local(2026, 11, 4, 15), local(2026, 11, 1)],
    ["week", "sunday", local(2026, 11, 1, 9), local(2026, 11, 1)],
    ["month", "monday", local(2026, 11, 30, 23), local(2026, 11, 1)],
  ] as const)("%s (%s) of %s", (unit, weekStart, date, expected) => {
    expect(periodStart(date, unit, weekStart)).toEqual(expected);
  });
});

describe("nextDueDate", () => {
  it.each([
    [local(2026, 11, 4, 22), 1, "day", local(2026, 11, 5)],
    [local(2026, 11, 4, 22), 3, "day", local(2026, 11, 7)],
    [local(2026, 11, 4), 1, "week", local(2026, 11, 9)],
    [local(2026, 11, 4), 2, "week", local(2026, 11, 16)],
    [local(2026, 12, 30), 1, "week", local(2027, 1, 4)],
    [local(2026, 1, 31), 1, "month", local(2026, 2, 1)],
    [local(2026, 11, 15), 3, "month", local(2027, 2, 1)],
  ] as const)("done %s every %i %s", (doneAt, every, unit, expected) => {
    expect(nextDueDate(doneAt, every, unit)).toEqual(expected);
  });

  it("treats an interval below 1 as 1", () => {
    expect(nextDueDate(local(2026, 11, 4), 0, "day")).toEqual(
      local(2026, 11, 5),
    );
  });
});

describe("isRecurrenceDue", () => {
  const doneAt = local(2026, 11, 4, 10).toISOString();

  it("is due once the next period has started", () => {
    const task = {
      recurring: true,
      done: true,
      doneAt,
      repeatEvery: 3,
      repeatUnit: "day" as const,
    };
    expect(isRecurrenceDue(task, local(2026, 11, 6, 23, 59))).toBe(false);
    expect(isRecurrenceDue(task, local(2026, 11, 7))).toBe(true);
  });

  it("defaults to every 1 week", () => {
    const task = { recurring: true, done: true, doneAt };
    expect(isRecurrenceDue(task, local(2026, 11, 8, 23))).toBe(false);
    expect(isRecurrenceDue(task, local(2026, 11, 9))).toBe(true);
  });

  it("respects a Sunday week start", () => {
    const task = { recurring: true, done: true, doneAt };
    expect(isRecurrenceDue(task, local(2026, 11, 8), "sunday")).toBe(true);
  });

  it.each([
    ["not recurring", { recurring: false, done: true, doneAt }],
    ["not done", { recurring: true, done: false, doneAt }],
    ["no doneAt", { recurring: true, done: true, doneAt: null }],
  ])("is never due when %s", (_label, task) => {
    expect(isRecurrenceDue(task, local(2030, 1, 1))).toBe(false);
  });
});
