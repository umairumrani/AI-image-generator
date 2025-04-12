const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for images
const imageHistory = [];

// Generate image endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Stability AI API key
    const API_KEY = 'sk-lKVFlxV2g1QDr0wTPVwz9nzFEbmyH1SGIY1RytHAo9xgazTF';
    
    // Call Stability AI API
    const response = await axios.post(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        text_prompts: [
          {
            text: prompt,
            weight: 1
          }
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 25,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );
    
    // Extract image data
    const imageData = response.data.artifacts[0];
    const imageUrl = `data:image/png;base64,${imageData.base64}`;
    
    // Save to history
    const newImage = {
      id: Date.now().toString(),
      prompt,
      imageUrl,
      createdAt: new Date().toISOString()
    };
    
    imageHistory.unshift(newImage);
    
    // Return success response
    res.status(200).json({
      success: true,
      data: newImage
    });
    
  } catch (error) {
    console.error('Error generating image:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to generate image. Please try again.'
    });
  }
});

// Get image history endpoint
app.get('/api/history', (req, res) => {
  res.status(200).json({
    success: true,
    data: imageHistory
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Image generation server running on port ${PORT}`);
});
