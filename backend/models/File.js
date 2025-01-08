const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  fileData: { type: Buffer, required: true }, // Store binary data
  originalName: { type: String, required: true },
  fileType: { type: String, required: true },
  major: { type: String, required: true },
  course: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("File", fileSchema);
