import type { Types } from "mongoose";
import { Household } from "#server/models/Household";
import { Task } from "#server/models/Task";
import { User } from "#server/models/User";
import { AppNotification } from "#server/models/AppNotification";
import { DeviceToken } from "#server/models/DeviceToken";
import { isFcmConfigured, sendPush, type FcmConfig } from "#server/utils/fcm";
import {
  DEFAULT_TIMEZONE,
  isReminderDay,
  localDate,
  memberReminders,
  reminderText,
  reminderWeekKey,
  type MemberReminder,
} from "#server/utils/weekReminders";

async function pushReminders(
  config: FcmConfig,
  householdId: Types.ObjectId,
  reminders: MemberReminder[],
  locales: Map<string, string | undefined>,
) {
  const tokens = await DeviceToken.find({
    householdId,
    userId: { $in: reminders.map((r) => r.userId) },
  }).lean();
  const stale: string[] = [];
  await Promise.all(
    tokens.map(async (device) => {
      const reminder = reminders.find((r) => r.userId === device.userId);
      if (!reminder) return;
      const result = await sendPush(config, device.token, {
        ...reminderText(locales.get(device.userId), reminder),
        data: { route: "/todos" },
      });
      if (result === "unregistered") stale.push(device.token);
    }),
  );
  if (stale.length) await DeviceToken.deleteMany({ token: { $in: stale } });
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const auth = getHeader(event, "authorization");
  if (!config.cronSecret || auth !== `Bearer ${config.cronSecret}`) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const { now: nowParam } = getQuery(event);
  const now = nowParam ? new Date(String(nowParam)) : new Date();
  if (Number.isNaN(now.getTime())) {
    throw createError({ statusCode: 400, statusMessage: "Invalid now" });
  }

  const canPush = isFcmConfigured(config);
  if (!canPush) console.warn("[week-reminders] FCM not configured, push skipped");

  const households = await Household.find({}).lean();
  let notified = 0;

  for (const household of households) {
    const weekStartDay = household.weekStartDay ?? "monday";
    const today = localDate(now, household.timezone ?? DEFAULT_TIMEZONE);
    if (!isReminderDay(today, weekStartDay)) continue;

    const week = reminderWeekKey(today, weekStartDay);
    const claimed = await Household.updateOne(
      { _id: household._id, lastReminderWeek: { $ne: week } },
      { lastReminderWeek: week },
    );
    if (claimed.modifiedCount !== 1) continue;

    const [tasks, users] = await Promise.all([
      Task.find({ householdId: household._id }).lean(),
      User.find({ householdId: household._id, status: "active" }).lean(),
    ]);
    const reminders = memberReminders(
      tasks.map((task) => ({
        ...task,
        doneAt: task.doneAt ? new Date(task.doneAt).toISOString() : null,
      })),
      users.map((user) => user._id.toString()),
      now,
      weekStartDay,
    );
    if (!reminders.length) continue;

    await AppNotification.insertMany(
      reminders.map((r) => ({
        householdId: household._id,
        userId: r.userId,
        type: "week-reminder",
        data: { mine: r.mine, unassigned: r.unassigned },
      })),
    );
    notified += reminders.length;

    if (canPush) {
      const locales = new Map(
        users.map((user) => [user._id.toString(), user.locale]),
      );
      await pushReminders(config, household._id, reminders, locales).catch(
        (err) => console.error("[week-reminders] push failed", err),
      );
    }
  }

  return { ok: true, notified };
});
