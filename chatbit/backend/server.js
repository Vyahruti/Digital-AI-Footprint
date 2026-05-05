const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

console.log("Loaded API Key:", process.env.API_KEY ? "✓ Set" : "✗ Missing");

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", apiKey: process.env.API_KEY ? "configured" : "missing" });
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  const prompt = `
You are SafeBuddy – a Privacy and Cyber Safety Advisor.

User Question: ${userMessage}

Instructions:
- Give simple, practical advice
- Focus on online privacy and safety
- Use Indian context when relevant
- No illegal or unethical guidance
- Short and clear answers
- Provide safer alternatives
`;

  try {
    console.log("📨 Sending request to Gemini API...");
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { timeout: 10000 }
    );

    const reply = response.data.candidates[0].content.parts[0].text;
    console.log("✅ Got response from Gemini");
    res.json({ reply });
  } catch (error) {
    console.log("❌ ------ GEMINI ERROR ------");
    console.log("Status:", error.response?.status);
    console.log("Message:", error.message);
    console.log("Error data:", error.response?.data?.error);
    
    // Provide more specific error messages
    if (error.response?.status === 503) {
      res.json({ reply: "The AI service is temporarily overloaded. Please try again in a moment." });
    } else if (error.response?.status === 429) {
      res.json({ reply: "Rate limit exceeded. Please try again later." });
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      res.json({ reply: "API authentication error. Please contact support." });
    } else {
      res.json({ reply: "Unable to connect to the AI service. Please try again." });
    }
  }
});

app.listen(process.env.PORT || 5000, () => console.log(`🚀 Backend running on port ${process.env.PORT || 5000}`));
