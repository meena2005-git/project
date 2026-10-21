
require("dotenv").config();

const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));
app.use(express.static(__dirname));

app.post("/api/plan", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        error: "Please enter a prompt."
      });
    }

    if (prompt.length > 12000) {
      return res.status(400).json({
        error: "Text is too long. Please shorten it."
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "Groq API key is not configured."
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI study assistant. " +
                "Create realistic study timetables with breaks. " +
                "Summarize study notes in simple English."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);
      return res.status(502).json({
        error:
          data.error?.message ||
          "AI request failed. Check your Groq API key, quota and model."
      });
    }

    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(502).json({
        error: "AI returned an empty response. Please try again."
      });
    }

    res.json({ plan: answer });

  } catch (error) {
    console.error("Server error:", error.message);

    res.status(500).json({
      error: "Server error. Please try again."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Study Planner running on port ${PORT}`);
});
