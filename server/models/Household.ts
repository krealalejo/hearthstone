import mongoose, { Schema } from "mongoose";

// Note: householdId for other models is this document's _id.
// The Household model is the root tenant entity — its own _id is the householdId.
export interface IHousehold {
  name: string;
  emoji: string;
}

const HouseholdSchema = new Schema<IHousehold>(
  {
    name: { type: String, required: true },
    emoji: { type: String, default: "mdi-home" },
  },
  { timestamps: true },
);

// Hot-reload guard: prevent OverwriteModelError on dev hot-reload
export const Household =
  mongoose.models.Household ||
  mongoose.model<IHousehold>("Household", HouseholdSchema);
