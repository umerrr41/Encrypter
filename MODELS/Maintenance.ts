import { model, models, Schema } from "mongoose";

const maintenanceSchema = new Schema(
  {
    key: { type: String, default: "server", unique: true },
    enabled: { type: Boolean, default: false },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    message: { type: String, default: "App update in progress" },
  },
  { timestamps: true },
);

const Maintenance = models.Maintenance ?? model("Maintenance", maintenanceSchema);
export default Maintenance;