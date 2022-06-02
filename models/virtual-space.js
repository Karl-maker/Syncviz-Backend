const mongoose = require("mongoose");

//--------------------------------------------------------------------------------

const VirtualSpaceSchema = new mongoose.Schema(
 {
  name: { type: String, default: "" },
  description: { type: String, default: "" },
  host: { type: String, required: true },
  time_limit: { type: Number, default: 30 },
  attendant_limit: { type: Number, default: 100 },
  // Mutable
  models: [{ link: { type: String } }], // For more than one model
  current_amount_attending: { type: Number, default: 0 },
  private: { type: Boolean, default: 0 },
  password: { type: String },
 },
 {
  timestamps: true,
 }
);

const VirtualSpace = mongoose.model("VirtualSpace", VirtualSpaceSchema);

module.exports = VirtualSpace;
