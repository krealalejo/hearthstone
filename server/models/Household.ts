import mongoose, { Schema, type Model } from "mongoose";

export interface IHousehold {
  name: string;
  emoji: string;
  lastResetWeek?: string;
  weekStartDay?: "monday" | "sunday";
  currency?: string;
}

const HouseholdSchema = new Schema<IHousehold>(
  {
    name: { type: String, required: true },
    emoji: { type: String, default: "mdi-home" },
    lastResetWeek: { type: String },
    weekStartDay: {
      type: String,
      enum: ["monday", "sunday"],
      default: "monday",
    },
    currency: { type: String, default: "$" },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

export const Household = (mongoose.models.Household ||
  mongoose.model<IHousehold>(
    "Household",
    HouseholdSchema,
  )) as Model<IHousehold>;
