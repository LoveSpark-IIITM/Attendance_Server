// Example (MongoDB Schema)
const mongoose = require("mongoose");

const FacultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  designation: { type: String },
  password: { type: String, required: true }, // hashed
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Faculty", FacultySchema);
