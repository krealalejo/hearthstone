import mongoose, { Schema, Types } from "mongoose";

export interface IPendingInvite {
  householdId: Types.ObjectId;
  email: string;
  role: "admin" | "member";
}

const PendingInviteSchema = new Schema<IPendingInvite>(
  {
    householdId: {
      type: Schema.Types.ObjectId,
      ref: "Household",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
  },
  { timestamps: true },
);

// Compound index to prevent duplicate invites to the same email in a household
PendingInviteSchema.index({ householdId: 1, email: 1 }, { unique: true });

// Hot-reload guard: prevent OverwriteModelError on dev hot-reload
export const PendingInvite =
  mongoose.models.PendingInvite ||
  mongoose.model<IPendingInvite>("PendingInvite", PendingInviteSchema);
