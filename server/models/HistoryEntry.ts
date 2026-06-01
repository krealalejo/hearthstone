import mongoose, { Schema, Types, type Model } from "mongoose";

export interface IHistoryEntry {
  householdId: Types.ObjectId;
  date: string;
  items: { name: string; qty: number; price: number | null }[];
  total: number;
}

const HistoryEntrySchema = new Schema<IHistoryEntry>(
  {
    householdId: {
      type: Schema.Types.ObjectId,
      ref: "Household",
      required: true,
      index: true,
    },
    date: { type: String, required: true },
    items: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, default: null },
      },
    ],
    total: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Hot-reload guard: prevent OverwriteModelError on dev hot-reload
export const HistoryEntry = (mongoose.models.HistoryEntry ||
  mongoose.model<IHistoryEntry>(
    "HistoryEntry",
    HistoryEntrySchema,
  )) as Model<IHistoryEntry>;
