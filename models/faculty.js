// routes/faculty.js
import express from "express";
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

// POST /faculty/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ ok: false, message: "Missing username/password" });
    }
    // Pass the collection name and query
    const user = await mongo.findOne("faculty", { username, password });

    if (!user) {
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }
    // Remove password before sending
    delete user.password;
    return res.json({ ok: true, faculty: user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});


// GET /faculty/:id/subjects
router.get("/:id/subjects", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await mongo.findOne("faculty", {id});
    if (!user) return res.status(404).json({ ok: false, message: "Faculty not found" });

    return res.json({ ok: true, subjects: user.subjects });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

export default router;
