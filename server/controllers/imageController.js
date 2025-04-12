const axios = require("axios");
const Image = require("../models/Image");

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

        // Fall back to our predefined image collection
        imageUrl = await getImageFromCollection(prompt);
      }
    } else {
      // Use our predefined image collection if no API key is available
      console.log("No OpenAI API key found, using predefined image collection");
      imageUrl = await getImageFromCollection(prompt);
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

// Helper function to get an image from our predefined collection
async function getImageFromCollection(prompt) {
  try {
    console.log("Getting image from predefined collection");
    // Use a fixed set of high-quality images for common categories
    const imageMap = {
      'car': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg',
      'cat': 'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg',
      'dog': 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg',
      'mountain': 'https://images.pexels.com/photos/1366909/pexels-photo-1366909.jpeg',
      'beach': 'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg',
      'city': 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg',
      'flower': 'https://images.pexels.com/photos/1086178/pexels-photo-1086178.jpeg',
      'forest': 'https://images.pexels.com/photos/240040/pexels-photo-240040.jpeg',
      'sunset': 'https://images.pexels.com/photos/1237119/pexels-photo-1237119.jpeg',
      'food': 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
      'house': 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
      'person': 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
      'space': 'https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg',
      'technology': 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg',
      'water': 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg',
      'animal': 'https://images.pexels.com/photos/247431/pexels-photo-247431.jpeg',
      'building': 'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg',
      'nature': 'https://images.pexels.com/photos/3244513/pexels-photo-3244513.jpeg',
    };
    
    // Find the best match from our image map
    const promptLower = prompt.toLowerCase();
    let bestMatch = null;
    
    for (const [key, url] of Object.entries(imageMap)) {
      if (promptLower.includes(key)) {
        bestMatch = url;
        break;
      }
    }
    
    if (bestMatch) {
      console.log("Found matching image in our collection");
      return bestMatch;
    } else {
      // If no match, use a random image from our collection
      const keys = Object.keys(imageMap);
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      console.log("Using random image from our collection");
      return imageMap[randomKey];
    }
  } catch (error) {
    console.error("Error selecting image:", error);
    // Fallback to a default image
    return 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg';
  }
}

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
