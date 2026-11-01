import mongoose, { Schema, Types, type Model } from "mongoose";

export interface IAppNotification {
  householdId: Types.ObjectId;
  userId: string;
  type: "week-reminder";
  data: { mine: number; unassigned: number };
  readAt: Date | null;
}

const NOTIFICATION_TTL_SECONDS = 60 * 24 * 60 * 60;

const AppNotificationSchema = new Schema<IAppNotification>(
  {
    householdId: {
      type: Schema.Types.ObjectId,
      ref: "Household",
      required: true,
    },
    userId: { type: String, required: true },
    type: { type: String, enum: ["week-reminder"], required: true },
    data: {
      mine: { type: Number, default: 0 },
      unassigned: { type: Number, default: 0 },
    },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

AppNotificationSchema.index({ userId: 1, createdAt: -1 });
AppNotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: NOTIFICATION_TTL_SECONDS },
);

export const AppNotification = (mongoose.models.AppNotification ||
  mongoose.model<IAppNotification>(
    "AppNotification",
    AppNotificationSchema,
  )) as Model<IAppNotification>;
