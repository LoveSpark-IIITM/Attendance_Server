// routes/faculty.js
import express from "express";
import MongoDBConnection from "../MongoDb.js";
import dotenv from "dotenv";

dotenv.config();

const mongo = new MongoDBConnection(
  process.env.MONGO_URI,
  process.env.MONGO_DB
);
const router = express.Router();

await mongo.connect();

// ======================== Faculty Login ========================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Missing username/password" });
    }

    const user = await mongo.findOne("faculty", { username, password });
    if (!user) {
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    delete user.password; // remove sensitive info
    return res.json({ ok: true, faculty: user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ======================== Get Subjects ========================
router.get("/:id/subjects", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await mongo.findOne("faculty", { id });
    if (!user)
      return res.status(404).json({ ok: false, message: "Faculty not found" });

    return res.json({ ok: true, subjects: user.subjects });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ======================== Admin Features ========================

// Add new faculty
router.post("/add", async (req, res) => {
  try {
    const { username, password, name, id, subjects } = req.body;

    if (!username || !password || !name || !id) {
      return res
        .status(400)
        .json({ ok: false, message: "Missing required fields" });
    }

    // check if faculty already exists
    const existing = await mongo.findOne("faculty", { username });
    if (existing) {
      return res
        .status(400)
        .json({ ok: false, message: "Faculty already exists" });
    }

    const newFaculty = {
      username,
      password,
      name,
      id,
      subjects: subjects || [],
    };

    const inserted = await mongo.insertOne("faculty", newFaculty);
    return res.json({ ok: true, faculty: inserted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Update faculty info or subjects
router.put("/:id/update", async (req, res) => {
  try {
    const { id } = req.params; // faculty's custom id (not _id)
    const updates = req.body;

    const result = await mongo.updateOne(
      "faculty",
      { id: id },updates         // only set provided fields
    );
    if (result=== 0) {
      return res.status(404).json({ ok: false, message: "Faculty not found" });
    }

    return res.json({ ok: true, message: "Faculty updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ======================== Get All Faculty ========================
router.get("/list", async (req, res) => {
  try {
    const faculties = await mongo.findMany("faculty");
    return res.json({ ok: true, faculty: faculties });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ======================== Delete Faculty ========================
router.delete("/:id/delete", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await mongo.deleteOne("faculty", { id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ ok: false, message: "Faculty not found" });
    }

    return res.json({ ok: true, message: "Faculty deleted successfully" });
  } catch (err) {
    console.error("Delete Faculty Error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});


export default router;
