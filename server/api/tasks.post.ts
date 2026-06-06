import { Task } from "#server/models/Task";
import { taskSchema, validate } from "#server/utils/validate";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const body = validate(taskSchema, await readBody(event));

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
  const doc = task.toJSON();
  return { ...doc, id: doc._id.toString() };
});
