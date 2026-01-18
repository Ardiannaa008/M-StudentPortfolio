import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import sanitizeHtml from 'sanitize-html';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Allowed origins for CORS
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'https://m-student-portfolio.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  }
}));

// Sanitize helper function
function clean(dirty) {
  if (typeof dirty !== 'string') return '';
  return sanitizeHtml(dirty, { allowedTags: [], allowedAttributes: {} });
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Parse JSON
app.use(express.json());

// ✅ Content Security Policy updated for Font Awesome CDN
app.use((req, res, next) => {
  res.setHeader(
  "Content-Security-Policy",
  [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "script-src 'self'",
    "img-src 'self' data: https:",
    "connect-src 'self'"
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

// MongoDB schema and model
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
    for (const key in req.body) {
      sanitizedData[key] = clean(req.body[key]);
    }

    const newCard = new Card(sanitizedData);
    const savedCard = await newCard.save();
    res.status(201).json(savedCard);
  } catch (err) {
    console.error("Error saving card:", err);
    res.status(500).json({ error: "Failed to save card" });
  }
});

// Fallback route to serve index.html
app.get(/.*/, (req, res) => {
  console.log("Fallback route hit for:", req.url);
  res.sendFile(path.join(__dirname, "public", "index.html"));
});



app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
