// routes/attendance.js
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
function dot(a, b) {
  return a.reduce((acc, v, i) => acc + v * b[i], 0);
}

function mag(a) {
  return Math.sqrt(a.reduce((acc, v) => acc + v * v, 0));
}

function cosineSimilarity(a, b) {
  const m1 = mag(a);
  const m2 = mag(b);
  if (!m1 || !m2) return 0;
  return dot(a, b) / (m1 * m2);
}

function euclideanDistance(a, b) {
  return Math.sqrt(a.reduce((acc, v, i) => acc + (v - b[i]) ** 2, 0));
}

// ---- Mark attendance ----
// body: { facultyId, subject, batch, section, timestamp, detectedDescriptors: [[...], [...]] }
router.post("/mark", async (req, res) => {
  try {
    const { facultyId, subject, batch, section, timestamp, detectedDescriptors } = req.body;
    if (!facultyId || !subject || !batch || !section || !detectedDescriptors) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    // Load students matching batch & section for efficiency
    const students = await mongo.findMany("students", { batch, section });

    const present = []; // roll numbers
    const matches = []; // {roll, name, score}

    for (const desc of detectedDescriptors) {
      let best = null;
      for (const s of students) {
        if (!s.embedding) continue;
        const cos = cosineSimilarity(desc, s.embedding);
        const dist = euclideanDistance(desc, s.embedding);
        if (!best || cos > best.cos) {
          best = { student: s, cos, dist };
        }
      }

      // Thresholds: cos > 0.85 & dist < 0.6
      if (best && best.cos > 0.85 && best.dist < 0.6) {
        if (!present.includes(best.student.roll)) {
          present.push(best.student.roll);
          matches.push({ roll: best.student.roll, name: best.student.name, score: best.cos });
        }
      }
    }

    // Create attendance record
    const record = {
      facultyId,
      subject,
      batch,
      section,
      timestamp: timestamp || new Date().toISOString(),
      present,
      matches,
    };

    const insertedId = await mongo.insertOne("attendance", record);
    record._id = insertedId;

    return res.json({ ok: true, record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ---- List attendance ----
router.get("/", async (req, res) => {
  try {
    const { subject, batch, section } = req.query;
    let query = {};
    if (subject) query.subject = subject;
    if (batch) query.batch = batch;
    if (section) query.section = section;

    const records = await mongo.findMany("attendance", query);

    // Flatten to roll-based records
    const expanded = [];
    for (const rec of records) {
      const date = rec.timestamp.split("T")[0]; // yyyy-mm-dd
      for (const roll of rec.present) {
        expanded.push({ roll, date, status: "present" });
      }
    }

    res.json({ records: expanded, total: records.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

export default router;
