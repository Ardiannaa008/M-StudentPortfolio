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

// Sanitize helper function
function clean(dirty) {
  if (typeof dirty !== 'string') return '';
  return sanitizeHtml(dirty, {
    allowedTags: [],
    allowedAttributes: {}
  });
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; object-src 'none';");
  next();
});

app.use(express.static(path.join(__dirname, "../public")));

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
});

const Card = mongoose.model("Card", cardSchema);

app.get("/api/cards", async (req, res) => {
  try {
    const cards = await Card.find().sort({ _id: -1 });
    res.json(cards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

app.post("/api/cards", async (req, res) => {
  try {
    if (req.body.email) {
      const existingCard = await Card.findOne({ email: req.body.email });
      if (existingCard) {
        return res.status(409).json({ error: "Card with this email already exists" });
      }
    }


    const sanitizedData = {
      fullName: clean(req.body.fullName),
      initials: clean(req.body.initials),
      university: clean(req.body.university),
      program: clean(req.body.program),
      year: clean(req.body.year),
      bio: clean(req.body.bio),
      skills: clean(req.body.skills),
      projectTitle: clean(req.body.projectTitle),
      projectDescription: clean(req.body.projectDescription),
      email: clean(req.body.email),
      linkedin: clean(req.body.linkedin),
    };

    const newCard = new Card(sanitizedData);
    const savedCard = await newCard.save();
    res.status(201).json(savedCard);
  } catch (err) {
    console.error("Error saving card:", err);
    res.status(500).json({ error: "Failed to save card" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
