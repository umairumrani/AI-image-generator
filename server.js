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
      "sk-bAMnbg0P1o9Ia31BFASDnqLNhJe1p9U6w5kkDgie84NeEHRx";

    // Check API credits before generating image
    try {
      const creditResponse = await axios.get(
        "https://api.stability.ai/v1/user/balance",
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );

      const credits = creditResponse.data.credits;
      console.log(`Current API credits: ${credits}`);

      // We're not blocking based on credits anymore since we've optimized the request
    } catch (error) {
      if (error.message.includes("Insufficient credits")) {
        throw error;
      }
      // If we can't check credits, just continue with the request
      console.log("Could not check API credits, continuing with request");
    }

    // Function to call Stability AI API with retry logic
    const callStabilityAPI = async (retries = 3, delay = 1000) => {
      let lastError;

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`API attempt ${attempt}/${retries}`);

          // Call Stability AI API - Using the appropriate endpoint for SDXL 1.0
          // Try both endpoints to see which one works with your API key
          const endpoint =
            attempt % 2 === 1
              ? "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"
              : "https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image";

          console.log(`Trying endpoint: ${endpoint}`);

          return await axios.post(
            endpoint,
            {
              text_prompts: [
                {
                  text: prompt,
                  weight: 1,
                },
              ],
              cfg_scale: 7,
              // Using dimensions that work with both SDXL and SD 1.6
              height: 512,
              width: 512,
              samples: 1,
              steps: 15,
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`,
                Accept: "application/json",
              },
              timeout: 25000, // 25 second timeout
            }
          );
        } catch (error) {
          lastError = error;
          console.log(`Attempt ${attempt} failed: ${error.message}`);

          // Log detailed error information
          if (error.response) {
            console.log("API Response Error:", {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data,
            });

            // Check for common API key issues
            if (error.response.status === 401) {
              console.log(
                "API Key Authentication Error: Your API key may be invalid or not yet activated"
              );
            } else if (error.response.status === 403) {
              console.log(
                "API Key Permission Error: Your API key may not have permission to use this model"
              );
            }
          }

          // If we have more retries, wait before trying again
          if (attempt < retries) {
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            // Increase delay for next attempt (exponential backoff)
            delay *= 2;
          }
        }
      }

      // If we get here, all retries failed
      throw lastError;
    };

    // Call the API with retry logic
    const response = await callStabilityAPI();

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

    // Log more detailed error information
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("API Response Error:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });

      // Return more specific error message if available
      if (error.response.data && error.response.data.message) {
        return res.status(error.response.status).json({
          success: false,
          error: `API Error: ${error.response.data.message}`,
          details: error.response.data,
        });
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("API Request Error (No Response):", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("API Request Setup Error:", error.message);
    }

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
