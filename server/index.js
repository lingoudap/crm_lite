// =================== IMPORTS ===================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import mongoose from "mongoose";

// Models
import User from "./models/User.js";
import Lead from "./models/Leads.js";
import Customer from "./models/Customer.js";
import Order from "./models/Order.js";

// Routes
import followUpRoutes from "./routes/followUps.js";
import quotationRoutes from "./routes/quotationRoutes.js";
import leadsRoutes from "./routes/leadsRoutes.js";
import bulkUploadRoutes from "./routes/bulkUploadRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

// Config
import connectDB from "./config/db.js";

// =================== INIT ===================
const app = express();
dotenv.config();

// =================== CONNECT DB ===================
connectDB()
  .then(async () => {
    console.log("✅ MongoDB connected");
    
    // Drop and recreate users collection to fix index issues
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const usersCollectionExists = collections.some(c => c.name === 'users');
      
      if (usersCollectionExists) {
        const indexes = await db.collection('users').getIndexes();
        console.log("📋 Current indexes on users collection:", Object.keys(indexes));
        
        // Check if problematic username index exists
        if (Object.keys(indexes).some(idx => idx.includes('username'))) {
          console.log("🔄 Dropping users collection to fix index conflicts...");
          await db.collection('users').drop();
          console.log("✅ Users collection dropped and will be recreated");
        }
      }
    } catch (err) {
      console.log("ℹ️ Collection reset handled");
    }
  })
  .catch((err) => console.error("❌ DB connect error", err));

// =================== MIDDLEWARE ===================
app.use(cors());
app.use(express.json());

// =================== BASIC ROUTE (IMPORTANT) ===================
app.get("/", (req, res) => {
  res.send("🚀 CRM API is running");
});

// =================== ROUTES ===================
app.use("/api/templates", templateRoutes);
app.use("/api/followups", followUpRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api", bulkUploadRoutes);

// =================== AUTH ROUTES ===================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    console.log("🔍 Login attempt:", email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role || "user",
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ error: "Login failed - Server error" });
  }
});

// =================== REGISTER ===================
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Name, email, and password required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const newUser = new User({
      email,
      password,
      name,
      createdAt: new Date(),
    });

    await newUser.save();

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({
      error: "Registration failed",
      details: error.message,
    });
  }
});

// =================== FILE STORAGE ===================
const uploadDir = "./uploads/pdfs";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/api/downloads", express.static(uploadDir));

// =================== CUSTOMERS ===================
app.post("/api/customers", async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    await newCustomer.save();

    res.status(201).json({
      message: "Customer added successfully!",
      customer: newCustomer,
    });
  } catch (error) {
    console.error("Error saving customer:", error);
    res.status(500).json({ error: "Failed to add customer" });
  }
});

app.get("/api/customers", async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// =================== API 404 ===================
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// =================== ERROR HANDLER ===================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// =================== START SERVER ===================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});