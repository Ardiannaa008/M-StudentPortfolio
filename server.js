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

const allowedOrigins = [
  'http://127.0.0.1:5500',
  'https://m-student-portfolio.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  }
}));

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


app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; object-src 'none';");
  next();
});

app.use(express.static(path.join(__dirname, "../public")));


const allowedDomains = [
  "ukim.edu.mk",    // Ss. Cyril and Methodius University
  "ugd.edu.mk",     // Goce Delčev University
  "uklo.edu.mk",    // St. Clement of Ohrid University
  "unite.edu.mk",   // State University of Tetova
  "uist.edu.mk",    // University of Information Science & Tech
  "seeu.edu.mk",    // South East European University
  "ibu.edu.mk",     // International Balkan University
  "fon.edu.mk",     // FON University
  "uacs.edu.mk",    // University American College Skopje
  "eurm.edu.mk",    // European University – Republic of Macedonia
  "euba.edu.mk",    // Euro-Balkan University
  "eust.edu.mk",    // International University of Struga
  "mit.edu.mk",     // MIT University Skopje
  "utms.edu.mk",    // University for Tourism and Management
  "esra.com.mk",    // Audiovisual Arts / ESRA
  "fbe.edu.mk",     // Business Academy Smilevski
  "eurocollege.edu.mk" // Eurocollege Kumanovo
];

function isValidUniversityEmail(email) {
  if (!email.includes("@")) return false;
  const domain = email.split("@")[1].toLowerCase();
  return allowedDomains.includes(domain);
}

// Example usage:
console.log(isValidUniversityEmail("student@ukim.edu.mk")); // true
console.log(isValidUniversityEmail("random@gmail.com")); // false

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

app.get("/api/cards", async (req, res) => {
  try {
    const cards = await Card.find().sort({ _id: -1 });
    res.json(cards);
  } catch (err) {
    console.error("❌ Error in GET /api/cards:", err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/cards", async (req, res) => {
  try {
    const email = req.body.email;

    // Check if email exists
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // ✅ Check if email is from allowed university domains
    if (!isValidUniversityEmail(email)) {
      return res.status(403).json({ error: "Only university emails are allowed" });
    }

    // Prevent duplicate cards for same email
    const existingCard = await Card.findOne({ email: email });
    if (existingCard) {
      return res.status(409).json({ error: "Card with this email already exists" });
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
      github: clean(req.body.github), 
      instagram: clean(req.body.instagram), 
      twitter: clean(req.body.twitter)
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
