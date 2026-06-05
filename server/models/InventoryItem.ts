import mongoose, { Schema, Types, type Model } from "mongoose";

export interface IInventoryItem {
  householdId: Types.ObjectId;
  name: string;
  cat: "food" | "cleaning" | "misc";
  qty: number;
  min: number;
  optimal: number;
  price: number | null;
  icon: string;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    householdId: {
      type: Schema.Types.ObjectId,
      ref: "Household",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    cat: {
      type: String,
      enum: ["food", "cleaning", "misc"],
      required: true,
    },
    qty: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
    optimal: { type: Number, default: 0 },
    price: { type: Number, default: null },
    icon: { type: String, default: "" },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

export const InventoryItem = (mongoose.models.InventoryItem ||
  mongoose.model<IInventoryItem>(
    "InventoryItem",
    InventoryItemSchema,
  )) as Model<IInventoryItem>;
