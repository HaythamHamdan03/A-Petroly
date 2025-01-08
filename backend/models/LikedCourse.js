const mongoose = require("mongoose");

const likedCourseSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  courseId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("LikedCourse", likedCourseSchema);
