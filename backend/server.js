const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const File = require("./models/File");
const LikedCourse = require("./models/LikedCourse"); // Import the model

dotenv.config();
const app = express();
const PORT = 3000;

app.use(express.json()); // Parse incoming JSON requests

// Connect to MongoDB
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
    process.exit(1); // Exit the process if the connection fails
  });

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads"); // Root-level uploads folder
    if (!fs.existsSync(uploadPath)) {
      console.log("Uploads folder does not exist, creating it...");
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName); // Ensure unique filenames
  },
});

// Middleware to check if the user is authenticated
const checkAuth = (req, res, next) => {
  const userEmail = req.query.userEmail || req.body.userEmail;

  if (!userEmail) {
    return res.status(401).json({ message: "Unauthorized: Please sign in." });
  }

  next();
};

const upload = multer({
  storage, // Use diskStorage configuration
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Middleware to serve static files
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Temporary in-memory storage
const uploadedFiles = [];

app.post("/liked-courses", checkAuth, async (req, res) => {
  const { userEmail, courseId } = req.body;

  if (!userEmail || !courseId) {
    return res.status(400).json({ message: "Missing userEmail or courseId" });
  }

  try {
    // Check if the course is already liked by the user
    const existingLike = await LikedCourse.findOne({ userEmail, courseId });
    if (existingLike) {
      return res.status(200).json({ message: "Course is already liked" });
    }

    // Add the course if it's not already liked
    const likedCourse = await LikedCourse.create({ userEmail, courseId });
    res
      .status(201)
      .json({ message: "Course liked successfully!", likedCourse });
  } catch (error) {
    console.error("Error liking course:", error);
    res.status(500).json({ message: "Failed to like course" });
  }
});

// Retrieve liked courses for a specific user
app.get("/liked-courses", checkAuth, async (req, res) => {
  try {
    const { userEmail } = req.query;

    if (!userEmail) {
      return res.status(400).json({ message: "Missing userEmail" });
    }

    const likedCourses = await LikedCourse.find({ userEmail });

    res.json(likedCourses);
  } catch (error) {
    console.error("Error retrieving liked courses:", error);
    res.status(500).json({ message: "Failed to retrieve liked courses" });
  }
});

// Handle file uploads
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("Upload endpoint hit");

    const file = req.file;
    const { fileType, major, course } = req.body;

    console.log("Uploaded file:", file);
    console.log("File metadata:", { fileType, major, course });

    const newFile = new File({
      fileData: fs.readFileSync(file.path), // Read binary data from the file
      originalName: file.originalname,
      fileType: fileType.toLowerCase(),
      major: major.toLowerCase(),
      course: course.toLowerCase(),
    });

    await newFile.save(); // Use await to handle async save
    console.log("File saved to database");

    // Send response only after successful save
    res.status(200).json({
      message: "File uploaded and saved successfully!",
      filePath: `/uploads/${file.filename}`,
    });
  } catch (error) {
    console.error("Error saving file to database:", error);

    // Send error response only if nothing has been sent yet
    if (!res.headersSent) {
      res.status(500).json({ message: "Error uploading file" });
    }
  }
});

// Remove a liked course for a user
app.delete("/liked-courses", checkAuth, async (req, res) => {
  try {
    const { userEmail, courseId } = req.query;

    if (!userEmail || !courseId) {
      return res.status(400).json({ message: "Missing userEmail or courseId" });
    }

    const result = await LikedCourse.deleteOne({ userEmail, courseId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Liked course not found" });
    }

    res.json({ message: "Course unliked successfully!" });
  } catch (error) {
    console.error("Error unliking course:", error);
    res.status(500).json({ message: "Failed to unlike course" });
  }
});

// Endpoint to retrieve files
// Endpoint to retrieve files from MongoDB
// Endpoint to retrieve files based on query parameters (metadata only)
app.get("/files", async (req, res) => {
  try {
    const { major, course, fileType } = req.query;

    // Build query object based on provided filters
    const query = {};
    if (major) query.major = major.toLowerCase();
    if (course) query.course = course.toLowerCase();
    if (fileType) query.fileType = fileType.toLowerCase();

    // Fetch files from MongoDB
    const files = await File.find(query);

    // If no files are found, return a 404 response
    if (files.length === 0) {
      return res.status(404).json({ message: "No files found" });
    }

    // Map the files to return metadata only (excluding binary data)
    const fileList = files.map((file) => ({
      id: file._id,
      originalName: file.originalName,
      fileType: file.fileType,
      major: file.major,
      course: file.course,
    }));

    res.json(fileList); // Send back the metadata list
  } catch (error) {
    console.error("Error retrieving files:", error);
    res.status(500).json({ message: "Error retrieving files" });
  }
});

// Endpoint to retrieve and serve a specific file's binary data by ID
app.get("/files/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).send("File not found");
    }

    // Detect the file extension and set appropriate headers
    const extension = path.extname(file.originalName).toLowerCase();
    let contentType;
    switch (extension) {
      case ".pdf":
        contentType = "application/pdf";
        break;
      case ".docx":
        contentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        break;
      default:
        contentType = "application/octet-stream"; // Default for other file types
    }

    res.set("Content-Type", contentType);
    res.set("Content-Disposition", `inline; filename="${file.originalName}"`);

    res.send(file.fileData); // Send the file's binary data
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(500).send("Error retrieving file");
  }
});

// Serve HTML files dynamically from the views folder
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/updated_index.html"));
});

app.get("/your-courses", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/your_courses.html"));
});

app.get("/general-courses", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/general_courses.html"));
});

app.get("/files-by-majors", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/updated_majors.html"));
});

app.get("/add-files", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/add_files.html"));
});

app.get("/file-list", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/file_list.html"));
});

app.get("/major-courses", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/major_courses.html"));
});

app.get("/courses", async (req, res) => {
  try {
    // Assuming your courses are stored in a JSON file
    const coursesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "data/courses.json"), "utf8")
    );

    res.json(coursesData);
  } catch (error) {
    console.error("Error loading courses:", error);
    res.status(500).json({ message: "Failed to load courses" });
  }
});

// Catch-all route for 404 errors
app.use((req, res) => {
  res.status(404).send("404: Page not found");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
