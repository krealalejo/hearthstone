import mongoose, { Schema, Types, type Model } from "mongoose";

export interface IShoppingItem {
  householdId: Types.ObjectId;
  name: string;
  source: "auto" | "manual";
  invId: string | null;
  qty: number;
  price: number | null;
  checked: boolean;
}

const ShoppingItemSchema = new Schema<IShoppingItem>(
  {
    householdId: {
      type: Schema.Types.ObjectId,
      ref: "Household",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    source: {
      type: String,
      enum: ["auto", "manual"],
      required: true,
    },
    invId: { type: String, default: null },
    qty: { type: Number, default: 1 },
    price: { type: Number, default: null },
    checked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Hot-reload guard: prevent OverwriteModelError on dev hot-reload
export const ShoppingItem = (mongoose.models.ShoppingItem ||
  mongoose.model<IShoppingItem>(
    "ShoppingItem",
    ShoppingItemSchema,
  )) as Model<IShoppingItem>;
