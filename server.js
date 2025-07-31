import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Define a Mongoose schema and model for cards
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
  id: Number,
});

const Card = mongoose.model("Card", cardSchema);

// GET all cards
app.get("/api/cards", async (req, res) => {
  try {
    const cards = await Card.find().sort({ id: -1 }); // newest first
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

// POST new card
app.post("/api/cards", async (req, res) => {
  try {
    const newCard = new Card(req.body);
    await newCard.save();
    res.status(201).json(newCard);
  } catch (err) {
    res.status(500).json({ error: "Failed to save card" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
