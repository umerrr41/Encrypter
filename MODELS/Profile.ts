import { model, models, Schema } from "mongoose";

const profileSchema = new Schema(
  {
    username: { type: String, enum: ["ADMIN", "Umer", "Saim"], required: true, unique: true },
    role: { type: String, enum: ["admin", "member"], required: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

const Profile = models.Profile ?? model("Profile", profileSchema);
export default Profile;