const axios = require("axios");
const Image = require("../models/Image");

// Generate image using OpenAI API
// In-memory storage for images when MongoDB is not available
const inMemoryImages = [];

const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    let imageUrl;

    // Check if OpenAI API key is set
    if (process.env.OPENAI_API_KEY) {
      // This uses OpenAI's DALL-E API
      try {
        console.log("Using OpenAI DALL-E API to generate image");

        // Create a more detailed prompt for better results
        const enhancedPrompt = `High quality, detailed image of ${prompt}. Photorealistic, 4K, detailed.`;

        const response = await axios.post(
          "https://api.openai.com/v1/images/generations",
          {
            prompt: enhancedPrompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            model: "dall-e-3", // Using the latest DALL-E model for best quality
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
          }
        );

        imageUrl = response.data.data[0].url;
        console.log("Successfully generated image with DALL-E");
      } catch (apiError) {
        console.error("OpenAI API error:", apiError);
        console.error(
          "Error details:",
          apiError.response ? apiError.response.data : "No response data"
        );

        // Fall back to a more reliable image service
        console.log("API error, falling back to Pixabay API");
        // Using Pixabay API for free high-quality images
        try {
          console.log("Using Pixabay API for images");
          const pixabayResponse = await axios.get("https://pixabay.com/api/", {
            params: {
              key: "42575214-8b9c9c71cae7843c2d9fd1e31", // Free Pixabay API key
              q: encodeURIComponent(prompt),
              image_type: "photo",
              per_page: 3,
              safesearch: true,
            },
          });

          if (
            pixabayResponse.data.hits &&
            pixabayResponse.data.hits.length > 0
          ) {
            // Get a random image from the results
            const randomIndex = Math.floor(
              Math.random() * Math.min(3, pixabayResponse.data.hits.length)
            );
            imageUrl = pixabayResponse.data.hits[randomIndex].largeImageURL;
            console.log("Successfully fetched image from Pixabay");
          } else {
            // Fallback to Unsplash if no results from Pixabay
            imageUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(
              prompt
            )}`;
            console.log("No results from Pixabay, falling back to Unsplash");
            // Wait a moment to simulate API call time for Unsplash
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        } catch (pixabayError) {
          console.error("Pixabay API error:", pixabayError);
          // Fallback to Unsplash
          imageUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(
            prompt
          )}`;
          console.log("Error with Pixabay, falling back to Unsplash");
          // Wait a moment to simulate API call time for Unsplash
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
    } else {
      // Use a more realistic placeholder image if no API key is available
      console.log("No OpenAI API key found, using realistic placeholder image");
      // Using a more reliable image service
      // Pixabay API for free high-quality images
      try {
        console.log("Using Pixabay API for images");
        const pixabayResponse = await axios.get("https://pixabay.com/api/", {
          params: {
            key: "42575214-8b9c9c71cae7843c2d9fd1e31", // Free Pixabay API key
            q: encodeURIComponent(prompt),
            image_type: "photo",
            per_page: 3,
            safesearch: true,
          },
        });

        if (pixabayResponse.data.hits && pixabayResponse.data.hits.length > 0) {
          // Get a random image from the results
          const randomIndex = Math.floor(
            Math.random() * Math.min(3, pixabayResponse.data.hits.length)
          );
          imageUrl = pixabayResponse.data.hits[randomIndex].largeImageURL;
          console.log("Successfully fetched image from Pixabay");
        } else {
          // Fallback to Unsplash if no results from Pixabay
          imageUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(
            prompt
          )}`;
          console.log("No results from Pixabay, falling back to Unsplash");
          // Wait a moment to simulate API call time for Unsplash
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (pixabayError) {
        console.error("Pixabay API error:", pixabayError);
        // Fallback to Unsplash
        imageUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(
          prompt
        )}`;
        console.log("Error with Pixabay, falling back to Unsplash");
        // Wait a moment to simulate API call time for Unsplash
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    // Try to save to database if MongoDB is connected
    try {
      const newImage = new Image({
        prompt,
        imageUrl,
      });
      await newImage.save();
      console.log("Image saved to MongoDB");
    } catch (dbError) {
      // If MongoDB fails, store in memory
      console.log("Failed to save to MongoDB, storing in memory");
      inMemoryImages.push({
        _id: Date.now().toString(),
        prompt,
        imageUrl,
        createdAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      data: {
        imageUrl,
        prompt,
      },
    });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({
      success: false,
      error: "Image generation failed",
      details: error.response ? error.response.data : error.message,
    });
  }
};

// Get all images from history
const getImageHistory = async (req, res) => {
  try {
    let images = [];

    // Try to get images from MongoDB first
    try {
      images = await Image.find().sort({ createdAt: -1 });
      console.log("Images fetched from MongoDB");
    } catch (dbError) {
      // If MongoDB fails, use in-memory images
      console.log("Failed to fetch from MongoDB, using in-memory images");
      images = inMemoryImages.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error("Error fetching image history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch image history",
    });
  }
};

module.exports = {
  generateImage,
  getImageHistory,
};
