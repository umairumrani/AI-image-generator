const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Serverless function for image generation
exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);
    const { prompt } = requestBody;
    
    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required' })
      };
    }
    
    console.log(`Generating image for prompt: "${prompt}"`);
    
    // Get Stability AI API key from environment variables
    const API_KEY = process.env.STABILITY_API_KEY;
    
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }
    
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
    
    // Generate a unique ID for the image
    const imageId = uuidv4();
    
    // Return the base64 image data directly
    // In a Netlify function, we can't save files to disk
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          imageId,
          imageUrl: `data:image/png;base64,${imageData.base64}`,
          prompt
        }
      })
    };
    
  } catch (error) {
    console.error('Error generating image:', error.message);
    
    // Return error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to generate image. Please try again.'
      })
    };
  }
};
