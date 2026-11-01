import { isRecurrenceDue, type Recurrence, type WeekStartDay } from "../../app/utils/recurrence";

export const DEFAULT_TIMEZONE = "Europe/Madrid";

export interface ReminderTask extends Recurrence {
  assignee?: string | null;
}

export interface MemberReminder {
  userId: string;
  mine: number;
  unassigned: number;
}

export function localDate(now: Date, timeZone: string): Date {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
  } catch {
    return localDate(now, DEFAULT_TIMEZONE);
  }
  const part = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
}

export function isReminderDay(day: Date, weekStartDay: WeekStartDay): boolean {
  const twoDaysBeforeWeekEnd = weekStartDay === "sunday" ? 4 : 5;
  return day.getUTCDay() === twoDaysBeforeWeekEnd;
}

export function reminderWeekKey(day: Date, weekStartDay: WeekStartDay): string {
  const offset =
    weekStartDay === "sunday" ? day.getUTCDay() : (day.getUTCDay() + 6) % 7;
  const start = new Date(day);
  start.setUTCDate(start.getUTCDate() - offset);
  return start.toISOString().slice(0, 10);
}

export function isPending(
  task: ReminderTask,
  now: Date,
  weekStartDay: WeekStartDay,
): boolean {
  return !task.done || isRecurrenceDue(task, now, weekStartDay);
}

export function memberReminders(
  tasks: ReminderTask[],
  memberIds: string[],
  now: Date,
  weekStartDay: WeekStartDay,
): MemberReminder[] {
  const pending = tasks.filter((task) => isPending(task, now, weekStartDay));
  const unassigned = pending.filter((task) => !task.assignee).length;
  return memberIds
    .map((userId) => ({
      userId,
      mine: pending.filter((task) => task.assignee === userId).length,
      unassigned,
    }))
    .filter((r) => r.mine + r.unassigned > 0);
}

export const REMINDER_MESSAGES = {
  en: {
    title: "2 days left this week",
    mine: "{n} task assigned to you | {n} tasks assigned to you",
    unassigned: "{n} unassigned task | {n} unassigned tasks",
  },
  es: {
    title: "Quedan 2 días de semana",
    mine: "{n} tarea tuya pendiente | {n} tareas tuyas pendientes",
    unassigned: "{n} tarea sin asignar | {n} tareas sin asignar",
  },
  ca: {
    title: "Queden 2 dies de setmana",
    mine: "{n} tasca teva pendent | {n} tasques teves pendents",
    unassigned: "{n} tasca sense assignar | {n} tasques sense assignar",
  },
};

function plural(message: string, n: number): string {
  const [one, other] = message.split(" | ");
  return ((n === 1 ? one : other) ?? one ?? "").replace("{n}", String(n));
}

export function reminderText(
  locale: string | undefined,
  reminder: Pick<MemberReminder, "mine" | "unassigned">,
): { title: string; body: string } {
  const copy =
    REMINDER_MESSAGES[(locale ?? "en") as keyof typeof REMINDER_MESSAGES] ??
    REMINDER_MESSAGES.en;
  const parts = [];
  if (reminder.mine) parts.push(plural(copy.mine, reminder.mine));
  if (reminder.unassigned)
    parts.push(plural(copy.unassigned, reminder.unassigned));
  return { title: copy.title, body: parts.join(" · ") };
}
