import { Task } from "#server/models/Task";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const body = await readBody(event);
  if (!body.title)
    throw createError({ statusCode: 400, statusMessage: "title required" });

  const task = await Task.create({
    householdId,
    title: body.title,
    desc: body.desc,
    roomId: body.roomId,
    assignee: body.assignee,
    xp: body.xp,
    recurring: body.recurring,
    done: body.done,
    doneBy: body.doneBy,
  });
  return task.toJSON();
});
