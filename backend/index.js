import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();

app.use(cors({
  origin: ["https://meratripai.vercel.app"], // allow your frontend
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(bodyParser.json());

// ✅ Health check route
app.get("/ping", (req, res) => {
  res.json({ status: "Backend is alive" });
});

// ✅ Main itinerary route
app.post("/api/itinerary", async (req, res) => {
  try {
    const { input } = req.body;

    console.log("Request received:", input);

    if (!input) {
      return res.status(400).json({ error: "Missing input" });
    }

    // Example logic — replace with OpenAI API call later
    const itinerary = {
      day1: `Explore ${input} city highlights`,
      day2: `Enjoy local food & culture in ${input}`,
      day3: `Relax and shopping in ${input}`
    };

    res.json({ itinerary });
  } catch (err) {
    console.error("Error generating itinerary:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Listen on Render's port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
