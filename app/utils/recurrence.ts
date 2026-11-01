export const REPEAT_UNITS = ["day", "week", "month"] as const;

export type RepeatUnit = (typeof REPEAT_UNITS)[number];

export type WeekStartDay = "monday" | "sunday";

export interface Recurrence {
  recurring: boolean;
  done: boolean;
  doneAt?: string | null;
  repeatEvery?: number;
  repeatUnit?: RepeatUnit;
}

export function periodStart(
  date: Date,
  unit: RepeatUnit,
  weekStartDay: WeekStartDay = "monday",
): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (unit === "week") {
    const offset =
      weekStartDay === "sunday" ? start.getDay() : (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - offset);
  } else if (unit === "month") {
    start.setDate(1);
  }
  return start;
}

export function nextDueDate(
  doneAt: Date,
  every: number,
  unit: RepeatUnit,
  weekStartDay: WeekStartDay = "monday",
): Date {
  const due = periodStart(doneAt, unit, weekStartDay);
  const step = Math.max(1, Math.floor(every));
  if (unit === "day") due.setDate(due.getDate() + step);
  else if (unit === "week") due.setDate(due.getDate() + step * 7);
  else due.setMonth(due.getMonth() + step);
  return due;
}

export function isRecurrenceDue(
  task: Recurrence,
  now: Date,
  weekStartDay: WeekStartDay = "monday",
): boolean {
  if (!task.recurring || !task.done || !task.doneAt) return false;
  const due = nextDueDate(
    new Date(task.doneAt),
    task.repeatEvery ?? 1,
    task.repeatUnit ?? "week",
    weekStartDay,
  );
  return now.getTime() >= due.getTime();
}
