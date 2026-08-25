import { User } from "#server/models/User";
import { PendingInvite } from "#server/models/PendingInvite";
import { serializeLean } from "#server/utils/serialize";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const [users, invites] = await Promise.all([
    User.find({ householdId }).lean(),
    PendingInvite.find({ householdId }).lean(),
  ]);

  return [
    ...serializeLean(users),
    ...serializeLean(invites).map((invite) => ({
      id: invite.id,
      name: "",
      email: invite.email,
      role: invite.role,
      status: "pending" as const,
      weekXp: 0,
      totalXp: 0,
    })),
  ];
});
