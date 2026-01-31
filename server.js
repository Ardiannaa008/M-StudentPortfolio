import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import sanitizeHtml from 'sanitize-html';
import User from "./models/User.js";

dotenv.config();

import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN))
});

const app = express();

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// Allowed origins for CORS
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'https://m-student-portfolio.vercel.app'
];

const universities = {
  UKIM: ["ukim.edu.mk", "finki.ukim.edu.mk", "pmf.ukim.edu.mk"],
  UGD: ["ugd.edu.mk"],
  UKLO: ["uklo.edu.mk"],
  SEEU: ["seeu.edu.mk"],
  AUE: ["aue.edu.mk"],
  FON: ["fon.edu.mk"],
  FEIT: ["feit.edu.mk"]
};

// Middleware to verify Firebase token
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.email = decoded.email;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  }
}));

// Serve Firebase config to frontend (public info only)
app.get("/api/firebase-config", (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID
  });
});

// Sanitize helper function
function clean(dirty) {
  if (typeof dirty !== 'string') return '';
  return sanitizeHtml(dirty, { allowedTags: [], allowedAttributes: {} });
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdn.tailwindcss.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://www.gstatic.com https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com"
    ].join("; ")
  );
  next();
});


// Serve static files from public
app.use(express.static(path.join(__dirname, "public")));

// University email validation
const allowedDomains = [
  "ukim.edu.mk","ugd.edu.mk","uklo.edu.mk","unite.edu.mk","uist.edu.mk",
  "seeu.edu.mk","ibu.edu.mk","fon.edu.mk","uacs.edu.mk","eurm.edu.mk",
  "euba.edu.mk","eust.edu.mk","mit.edu.mk","utms.edu.mk","esra.com.mk",
  "fbe.edu.mk","eurocollege.edu.mk"
];
function isValidUniversityEmail(email) {
  if (!email.includes("@")) return false;
  const domain = email.split("@")[1].toLowerCase();
  return allowedDomains.includes(domain);
}

// MongoDB schema
const cardSchema = new mongoose.Schema({
  fullName: String,
  initials: String,
  university: String,
  program: String,
  year: String,
  bio: String,
  skills: String,
  projectTitle: String,
  projectDescription: String,
  email: String,
  linkedin: String,
  github: String,
  instagram: String,
  twitter: String,
});
const Card = mongoose.model("Card", cardSchema);

// API routes
app.get("/api/cards", async (req, res) => {
  try {
    const cards = await Card.find().sort({ _id: -1 });
    res.json(cards);
  } catch (err) {
    console.error("❌ Error in GET /api/cards:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cards", async (req, res) => {
  try {
    const email = req.body.email;
    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!isValidUniversityEmail(email)) return res.status(403).json({ error: "Only university emails are allowed" });

    const existingCard = await Card.findOne({ email });
    if (existingCard) return res.status(409).json({ error: "Card with this email already exists" });

    const sanitizedData = {};
    for (const key in req.body) sanitizedData[key] = clean(req.body[key]);

    const newCard = new Card(sanitizedData);
    const savedCard = await newCard.save();
    res.status(201).json(savedCard);
  } catch (err) {
    console.error("Error saving card:", err);
    res.status(500).json({ error: err.message });
  }
});

// Save extra user info after Firebase signup
app.post("/api/user/profile", verifyToken, async (req, res) => {
  const { university } = req.body;
  const email = req.email;
  const uid = req.uid;

  if (!university) return res.status(400).json({ error: "University required" });

  const existing = await User.findOne({ uid });
  if (existing) return res.status(409).json({ error: "User already exists" });

  const domain = email.split("@")[1]?.toLowerCase();
  const allowedDomains = universities[university];

  if (!allowedDomains || !allowedDomains.includes(domain)) {
    return res.status(400).json({
      error: `Please use your ${allowedDomains?.[0]} university email`
    });
  }

  try {
    await User.create({ uid, email, university });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fallback route for SPA
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/landing.html"));
});




app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
