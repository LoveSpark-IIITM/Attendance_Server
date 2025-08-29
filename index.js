// index.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import studentsRouter from "./models/Student.js"; // Import your students.js router
import facultyRouter from "./models/faculty.js";
import attendanceRouter from "./models/Attendance.js";

const app = express();
const PORT = 5000;

// Middleware
app.use(cors()); // allow requests from frontend (React)
app.use(bodyParser.json({ limit: "10mb" })); // handle JSON and large embeddings

// Routes
app.use("/api/students", studentsRouter); // mount router at /api/students
app.use('/api/faculty', facultyRouter);
app.use('/api/attendance', attendanceRouter);

// Root endpoint
app.get("/", (req, res) => {
  res.send("Face Recognition Attendance Backend Running 🚀");
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
