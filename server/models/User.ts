import mongoose, { Schema, Types, type Model } from "mongoose";

export interface IUser {
  householdId: Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: "admin" | "member";
  status: "active" | "pending";
  weekXp: number;
  totalXp: number;
  accentColor?: string;
  avatarEmoji?: string;
  avatarImage?: string;
  locale?: "en" | "es" | "ca";
}

const UserSchema = new Schema<IUser>(
  {
    householdId: {
      type: Schema.Types.ObjectId,
      ref: "Household",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String },
    googleId: { type: String, unique: true, sparse: true, index: true },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
    status: {
      type: String,
      enum: ["active", "pending"],
      default: "active",
    },
    weekXp: { type: Number, default: 0 },
    totalXp: { type: Number, default: 0 },
    accentColor: { type: String },
    avatarEmoji: { type: String },
    avatarImage: { type: String },
    locale: { type: String, enum: ["en", "es", "ca"] },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

export const User = (mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema)) as Model<IUser>;
