import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const dataPath = path.join(__dirname, "cards.json");

// Load cards
app.get("/api/cards", (req, res) => {
  fs.readFile(dataPath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Failed to read cards" });
    res.json(JSON.parse(data));
  });
});

// Add new card
app.post("/api/cards", (req, res) => {
  const newCard = req.body;
  fs.readFile(dataPath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Failed to read cards" });

    const cards = JSON.parse(data);
    cards.push(newCard);

    fs.writeFile(dataPath, JSON.stringify(cards, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Failed to save card" });
      res.status(201).json(newCard);
    });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
