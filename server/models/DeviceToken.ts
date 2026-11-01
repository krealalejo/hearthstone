import mongoose, { Schema, Types, type Model } from "mongoose";

export interface IDeviceToken {
  householdId: Types.ObjectId;
  userId: string;
  token: string;
  platform: "android";
}

const DeviceTokenSchema = new Schema<IDeviceToken>(
  {
    householdId: {
      type: Schema.Types.ObjectId,
      ref: "Household",
      required: true,
    },
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String, enum: ["android"], default: "android" },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

export const DeviceToken = (mongoose.models.DeviceToken ||
  mongoose.model<IDeviceToken>(
    "DeviceToken",
    DeviceTokenSchema,
  )) as Model<IDeviceToken>;
