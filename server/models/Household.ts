import mongoose, { Schema, type Model } from "mongoose";

// Note: householdId for other models is this document's _id.
// The Household model is the root tenant entity — its own _id is the householdId.
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

// Hot-reload guard: prevent OverwriteModelError on dev hot-reload
export const Household = (mongoose.models.Household ||
  mongoose.model<IHousehold>(
    "Household",
    HouseholdSchema,
  )) as Model<IHousehold>;
