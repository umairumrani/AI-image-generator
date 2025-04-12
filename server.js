const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Create public directory if it doesn't exist
if (!fs.existsSync("public")) {
  fs.mkdirSync("public");
}

// API endpoint to generate image
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log(`Generating image for prompt: "${prompt}"`);

    // Get Stability AI API key from environment variables
    const API_KEY =
      process.env.STABILITY_API_KEY ||
      "sk-lKVFlxV2g1QDr0wTPVwz9nzFEbmyH1SGIY1RytHAo9xgazTF";

    // Call Stability AI API
    const response = await axios.post(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      {
        text_prompts: [
          {
            text: prompt,
            weight: 1,
          },
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 25,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/json",
        },
      }
    );

    // Extract image data
    const imageData = response.data.artifacts[0];

    // For Vercel deployment: return base64 data directly
    const isVercel = process.env.VERCEL === "1";

    if (isVercel) {
      // Return the base64 data directly
      console.log("Running on Vercel, returning base64 data");
      res.json({
        success: true,
        data: {
          imageUrl: `data:image/png;base64,${imageData.base64}`,
          prompt,
        },
      });
    } else {
      // Save the image to a file (for local development)
      const timestamp = Date.now();
      const filename = `image_${timestamp}.png`;
      const filepath = path.join(__dirname, "public", filename);

      // Convert base64 to buffer and save
      const buffer = Buffer.from(imageData.base64, "base64");
      fs.writeFileSync(filepath, buffer);

      console.log(`Image saved to ${filepath}`);

      // Return the image URL
      res.json({
        success: true,
        data: {
          imageUrl: `/${filename}`,
          prompt,
        },
      });
    }
  } catch (error) {
    console.error("Error generating image:", error.message);

    // Return error response
    res.status(500).json({
      success: false,
      error: "Failed to generate image. Please try again.",
    });
  }
});

// Serve the HTML page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
