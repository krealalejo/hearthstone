import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  REMINDER_MESSAGES,
  isPending,
  isReminderDay,
  localDate,
  memberReminders,
  reminderText,
  reminderWeekKey,
} from "#server/utils/weekReminders";

describe("REMINDER_MESSAGES", () => {
  it.each(["en", "es", "ca"] as const)(
    "matches the %s locale file used by the bell",
    (locale) => {
      const file = JSON.parse(
        readFileSync(
          resolve(process.cwd(), `i18n/locales/${locale}.json`),
          "utf8",
        ),
      );
      expect(REMINDER_MESSAGES[locale]).toEqual(
        file.notifications.weekReminder,
      );
    },
  );
});

const utcDay = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe("localDate", () => {
  it("returns the calendar day in the household timezone", () => {
    const now = new Date("2026-11-05T23:30:00Z");
    expect(localDate(now, "Europe/Madrid").toISOString()).toBe(
      "2026-11-06T00:00:00.000Z",
    );
    expect(localDate(now, "America/New_York").toISOString()).toBe(
      "2026-11-05T00:00:00.000Z",
    );
  });

  it("follows daylight saving time", () => {
    const summer = new Date("2026-07-02T22:30:00Z");
    const winter = new Date("2026-12-03T22:30:00Z");
    expect(localDate(summer, "Europe/Madrid").getUTCDate()).toBe(3);
    expect(localDate(winter, "Europe/Madrid").getUTCDate()).toBe(3);
    expect(localDate(new Date("2026-12-03T22:59:00Z"), "Europe/Madrid").getUTCDate()).toBe(3);
  });

  it("falls back to the default timezone for an invalid one", () => {
    const now = new Date("2026-11-05T23:30:00Z");
    expect(localDate(now, "Not/AZone").toISOString()).toBe(
      "2026-11-06T00:00:00.000Z",
    );
  });
});

describe("isReminderDay", () => {
  it("is Friday for weeks starting on Monday", () => {
    expect(isReminderDay(utcDay("2026-11-06"), "monday")).toBe(true);
    expect(isReminderDay(utcDay("2026-11-05"), "monday")).toBe(false);
    expect(isReminderDay(utcDay("2026-11-08"), "monday")).toBe(false);
  });

  it("is Thursday for weeks starting on Sunday", () => {
    expect(isReminderDay(utcDay("2026-11-05"), "sunday")).toBe(true);
    expect(isReminderDay(utcDay("2026-11-06"), "sunday")).toBe(false);
  });
});

describe("reminderWeekKey", () => {
  it("returns the first day of the week", () => {
    expect(reminderWeekKey(utcDay("2026-11-06"), "monday")).toBe("2026-11-02");
    expect(reminderWeekKey(utcDay("2026-11-08"), "monday")).toBe("2026-11-02");
    expect(reminderWeekKey(utcDay("2026-11-05"), "sunday")).toBe("2026-11-01");
  });
});

describe("isPending", () => {
  const now = new Date("2026-11-06T09:00:00Z");

  it("counts undone tasks", () => {
    expect(isPending({ recurring: false, done: false }, now, "monday")).toBe(
      true,
    );
  });

  it("skips done one-off tasks", () => {
    expect(
      isPending(
        { recurring: false, done: true, doneAt: "2026-11-03T10:00:00Z" },
        now,
        "monday",
      ),
    ).toBe(false);
  });

  it("counts done recurring tasks whose next period has started", () => {
    const task = {
      recurring: true,
      done: true,
      doneAt: "2026-10-28T10:00:00Z",
      repeatEvery: 1,
      repeatUnit: "week" as const,
    };
    expect(isPending(task, now, "monday")).toBe(true);
    expect(
      isPending({ ...task, doneAt: "2026-11-03T10:00:00Z" }, now, "monday"),
    ).toBe(false);
  });
});

describe("memberReminders", () => {
  const now = new Date("2026-11-06T09:00:00Z");
  const tasks = [
    { recurring: false, done: false, assignee: "u1" },
    { recurring: false, done: false, assignee: "u1" },
    { recurring: false, done: true, assignee: "u2" },
    { recurring: false, done: false, assignee: null },
    { recurring: false, done: false, assignee: "gone" },
  ];

  it("gives each member their own count plus the unassigned count", () => {
    expect(memberReminders(tasks, ["u1", "u2"], now, "monday")).toEqual([
      { userId: "u1", mine: 2, unassigned: 1 },
      { userId: "u2", mine: 0, unassigned: 1 },
    ]);
  });

  it("skips members with nothing pending", () => {
    const assignedOnly = tasks.filter((task) => task.assignee);
    expect(memberReminders(assignedOnly, ["u1", "u2"], now, "monday")).toEqual(
      [{ userId: "u1", mine: 2, unassigned: 0 }],
    );
  });
});

describe("reminderText", () => {
  it("joins both counts with plural forms", () => {
    expect(reminderText("en", { mine: 2, unassigned: 1 })).toEqual({
      title: "2 days left this week",
      body: "2 tasks assigned to you · 1 unassigned task",
    });
  });

  it("uses the singular and drops empty parts", () => {
    expect(reminderText("es", { mine: 1, unassigned: 0 }).body).toBe(
      "1 tarea tuya pendiente",
    );
    expect(reminderText("ca", { mine: 0, unassigned: 3 }).body).toBe(
      "3 tasques sense assignar",
    );
  });

  it("falls back to English", () => {
    expect(reminderText(undefined, { mine: 1, unassigned: 0 }).title).toBe(
      "2 days left this week",
    );
    expect(reminderText("fr", { mine: 1, unassigned: 0 }).title).toBe(
      "2 days left this week",
    );
  });
});
