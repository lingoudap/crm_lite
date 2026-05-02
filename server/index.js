// =================== IMPORTS ===================
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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
import templateRoutes from './routes/templateRoutes.js';
// Config
import connectDB from "./config/db.js";

const app = express();
dotenv.config();

// Connect MongoDB
connectDB()
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ DB connect error", err));

// =================== MIDDLEWARE ===================
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use('/api/templates', templateRoutes);

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
      console.log("❌ User not found:", email);
      return res.status(401).json({ error: "User not found" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log("❌ Invalid password:", email);
      return res.status(401).json({ error: "Invalid password" });
    }

    console.log("✅ Login successful:", email);

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

    console.log("📝 Registration attempt:", { email, name });

    // Validation
    if (!email || !password || !name) {
      console.log("❌ Missing fields");
      return res.status(400).json({ error: "Name, email, and password required" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ User already exists:", email);
      return res.status(400).json({ error: "User already exists" });
    }

    // Create new user
    const newUser = new User({ 
      email, 
      password, 
      name,
      createdAt: new Date()
    });
    
    await newUser.save();

    console.log("✅ User registered successfully:", email);
    res.status(201).json({ 
      message: "Registration successful",
      user: { id: newUser._id, email: newUser.email, name: newUser.name }
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ 
      error: "Registration failed", 
      details: error.message 
    });
  }
});


// Create uploads directory for PDFs
const uploadDir = './uploads/pdfs';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =================== ROUTES ===================
app.use("/api/followups", followUpRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api", bulkUploadRoutes);
app.use('/api/downloads', express.static('uploads/pdfs'));

// Customers CRUD
app.post("/api/customers", async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    await newCustomer.save();
    res
      .status(201)
      .json({ message: "Customer added successfully!", customer: newCustomer });
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

// =================== FRONTEND DEPLOYMENT ===================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👉 FIXED PATH (client folder is OUTSIDE /server folder)
const clientBuildPath = path.join(__dirname, "../client/build");

console.log("📁 Looking for React build at:", clientBuildPath);
console.log(
  "📁 index.html exists?",
  fs.existsSync(path.join(clientBuildPath, "index.html"))
);

app.use(express.static(clientBuildPath));

// 👉 API 404 Handler (for undefined API routes)
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// 👉 CATCH-ALL ROUTE (Must be AFTER all API routes)
app.get("*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// =================== ERROR HANDLING ===================
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// =================== START SERVER ===================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
