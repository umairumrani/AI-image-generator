// Web Worker for handling image generation API calls
self.addEventListener('message', async (e) => {
  const { prompt, apiKey } = e.data;
  
  try {
    // Post status update
    self.postMessage({ type: 'status', message: 'Connecting to AI service...' });
    
    // Make the API request
    const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
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
      }),
    });
    
    // Post status update
    self.postMessage({ type: 'status', message: 'Processing response...' });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API request failed with status ${response.status}: ${errorData.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    // Extract the image from the response
    const imageData = data.artifacts[0];
    const imageUrl = `data:image/png;base64,${imageData.base64}`;
    
    // Send the result back to the main thread
    self.postMessage({ 
      type: 'result', 
      imageUrl,
      prompt
    });
    
  } catch (error) {
    // Send the error back to the main thread
    self.postMessage({ 
      type: 'error', 
      error: error.message 
    });
  }
});
