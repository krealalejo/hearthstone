import mongoose, { Schema, Types, type Model } from "mongoose";

export interface ITodoItem {
  householdId: Types.ObjectId;
  text: string;
  done: boolean;
}

const TodoItemSchema = new Schema<ITodoItem>(
  {
    householdId: {
      type: Schema.Types.ObjectId,
      ref: "Household",
      required: true,
      index: true,
    },
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

export const TodoItem = (mongoose.models.TodoItem ||
  mongoose.model<ITodoItem>("TodoItem", TodoItemSchema)) as Model<ITodoItem>;
