import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Define Mongoose schema & model
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

// GET all cards from MongoDB
app.get("/api/cards", async (req, res) => {
  try {
    const cards = await Card.find().sort({ _id: -1 });
    res.json(cards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

// POST new card to MongoDB
app.post("/api/cards", async (req, res) => {
  try {
    console.log("Received card data:", req.body);  // <-- add this

    const newCard = new Card(req.body);
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
