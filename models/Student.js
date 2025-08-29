// routes/students.js
import express from "express";
import { ObjectId } from "mongodb";
import MongoDBConnection from "../MongoDb.js"; // adjust path
import dotenv from "dotenv";

dotenv.config(); // load .env variables

// MongoDB Atlas setup
const mongo = new MongoDBConnection(
  process.env.MONGO_URI,
  process.env.MONGO_DB
);
const router = express.Router();
await mongo.connect(); // ensure connection at server start

// ---- Distance + Similarity helpers ----
function normalize(vec) {
  const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0));
  return vec.map((v) => v / norm);
}

function euclideanDistance(vec1, vec2) {
  return Math.sqrt(vec1.reduce((acc, val, i) => acc + (val - vec2[i]) ** 2, 0));
}

function cosineSimilarity(vec1, vec2) {
  const dot = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((acc, v) => acc + v * v, 0));
  const mag2 = Math.sqrt(vec2.reduce((acc, v) => acc + v * v, 0));
  return dot / (mag1 * mag2);
}

// ---- Enroll API with precise duplicate detection ----
router.post("/enroll", async (req, res) => {
  try {
    const { roll, name, batch, section, embedding } = req.body;

    if (!roll || !name || !batch || !section || !embedding) {
      return res.json({
        duplicate: true,
        message: "Missing required fields (name, roll, batch, section, embedding)",
      });
    }

    const normEmb = normalize(embedding);

    // Load all students (or optionally filter by batch/section to reduce query)
    const students = await mongo.findMany("students");

    // Roll duplicate check
    if (students.find((s) => s.roll === roll)) {
      return res.json({
        duplicate: true,
        message: "Student roll number already exists!",
      });
    }

    // Duplicate face check
    for (const student of students) {
      const prevNorm = normalize(student.embedding);
      const dist = euclideanDistance(normEmb, prevNorm);
      const cos = cosineSimilarity(normEmb, prevNorm);

      if (dist < 0.35 && cos > 0.92) {
        return res.json({
          duplicate: true,
          message: `Duplicate face detected! Already enrolled as ${student.name} (Roll: ${student.roll}, Batch: ${student.batch}, Section: ${student.section})`,
        });
      }
    }

    // Save new student
    const insertedId = await mongo.insertOne("students", {
      roll,
      name,
      batch,
      section,
      embedding: normEmb,
    });

    res.json({ message: "✅ Student enrolled successfully!", id: insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ✅ List students with optional filters: /api/students?batch=X&section=Y
router.get("/", async (req, res) => {
  try {
    const { batch, section } = req.query;
    let query = {};
    if (batch) query.batch = batch;
    if (section) query.section = section;

    const students = await mongo.findMany("students", query);
    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ---- List all students ----
router.get("/list", async (req, res) => {
  try {
    const students = await mongo.findMany("students");
    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

export default router;
