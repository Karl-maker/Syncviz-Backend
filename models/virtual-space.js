const mongoose = require("mongoose");

//--------------------------------------------------------------------------------

const VirtualSpaceSchema = new mongoose.Schema(
 {
  name: { type: String, default: "" },
  description: { type: String, default: "" },
  host: { type: String, required: true },
  time_limit: { type: Number, default: 20 },
  current_amount_attending: { type: Number, default: 0 },
  private: { type: Boolean, default: 0 },
  password: { type: String },
  theme: { type: String, default: "#74b9ff" },
  url: {
   type: String,
   default:
    "http://192.168.0.6:7000/static/uploads_files_3285656_buildings.glb",
   //"https://assets.babylonjs.com/meshes/LevelOfDetail.glb",
  },
  user: {},
 },
 {
  timestamps: true,
 }
);

const VirtualSpace = mongoose.model("VirtualSpaces", VirtualSpaceSchema);

module.exports = VirtualSpace;
