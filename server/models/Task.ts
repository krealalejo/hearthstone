import mongoose, { Schema, Types } from "mongoose";

export interface ITask {
  householdId: Types.ObjectId;
  title: string;
  desc: string;
  roomId: string;
  assignee: string | null;
  xp: number;
  recurring: boolean;
  done: boolean;
  doneBy: string | null;
}

const TaskSchema = new Schema<ITask>(
  {
    householdId: {
      type: Schema.Types.ObjectId,
      ref: "Household",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    desc: { type: String, default: "" },
    roomId: { type: String, required: true },
    assignee: { type: String, default: null },
    xp: { type: Number, default: 10 },
    recurring: { type: Boolean, default: false },
    done: { type: Boolean, default: false },
    doneBy: { type: String, default: null },
  },
  { timestamps: true },
);

// Hot-reload guard: prevent OverwriteModelError on dev hot-reload
export const Task =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);
