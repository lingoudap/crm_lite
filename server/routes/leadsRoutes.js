import express from "express";
import Lead from "../models/Leads.js";

const router = express.Router();

// =================== CREATE LEAD ===================
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, address, state, Source, followUps, customFields } = req.body;

    // Validation
    if (!name || !email || !phone || !address || !state) {
      return res.status(400).json({ error: "All required fields must be filled" });
    }

    // Create new lead
    const newLead = new Lead({
      name,
      email,
      phone,
      address,
      state,
      Source: Source || "Other",
      followUps: followUps || [],
      customFields: customFields || {},
      createdAt: new Date()
    });

    await newLead.save();

    console.log("✅ Lead created:", name);
    res.status(201).json({ 
      message: "Lead added successfully!", 
      lead: newLead 
    });
  } catch (error) {
    console.error("❌ Error creating lead:", error);
    res.status(500).json({ error: "Failed to add lead", details: error.message });
  }
});

// =================== GET ALL LEADS ===================
router.get("/", async (req, res) => {
  try {
    console.log("📍 Fetching leads from collection...");
    const leads = await Lead.find().sort({ createdAt: -1 });
    console.log("✅ Found", leads.length, "leads");
    console.log("📊 Sample lead:", leads[0]);
    res.json(leads);
  } catch (error) {
    console.error("❌ Error fetching leads:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// =================== GET SINGLE LEAD ===================
router.get("/:id", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.json(lead);
  } catch (error) {
    console.error("❌ Error fetching lead:", error);
    res.status(500).json({ error: "Failed to fetch lead" });
  }
});

// =================== UPDATE LEAD ===================
router.put("/:id", async (req, res) => {
  try {
    const { name, email, phone, address, state, Source, followUps, customFields } = req.body;

    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, address, state, Source, followUps, customFields },
      { new: true, runValidators: true }
    );

    if (!updatedLead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    console.log("✅ Lead updated:", updatedLead.name);
    res.json({ message: "Lead updated successfully!", lead: updatedLead });
  } catch (error) {
    console.error("❌ Error updating lead:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

// =================== DELETE LEAD ===================
router.delete("/:id", async (req, res) => {
  try {
    const deletedLead = await Lead.findByIdAndDelete(req.params.id);
    if (!deletedLead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    console.log("✅ Lead deleted:", deletedLead.name);
    res.json({ message: "Lead deleted successfully!" });
  } catch (error) {
    console.error("❌ Error deleting lead:", error);
    res.status(500).json({ error: "Failed to delete lead" });
  }
});

export default router;
