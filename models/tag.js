const mongoose = require("mongoose");

//--------------------------------------------------------------------------------

const TagSchema = new mongoose.Schema(
 {
  virtual_room_id: { type: String, required: true },
  text: { type: String, required: true },
  link: { type: String },
  type: { type: String, default: "" },
 },
 {
  timestamps: true,
 }
);

const Tag = mongoose.model("Tags", TagSchema);

module.exports = Tag;
