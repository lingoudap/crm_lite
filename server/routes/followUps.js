import express from "express";
import FollowUp from "../models/FollowUp.js";

const router = express.Router();
 
// Get all follow-ups
router.get("/", async (req, res) => {
  try {
    const data = await FollowUp.find().sort({ followUpDate: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new follow-up
router.post("/", async (req, res) => {
  try {
    const { relatedType, relatedId, followUpDate, notes, status } = req.body;
    const followUp = new FollowUp({ relatedType, relatedId, followUpDate, notes, status });
    await followUp.save();
    res.json(followUp);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
