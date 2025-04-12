const axios = require('axios');

// Proxy an image to avoid CORS issues
const proxyImage = async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Fetch the image as a stream
    const response = await axios({
      method: 'get',
      url: decodeURIComponent(url),
      responseType: 'stream'
    });

    // Set the content type header
    res.set('Content-Type', response.headers['content-type']);
    
    // Disable CORS restrictions
    res.set('Access-Control-Allow-Origin', '*');
    
    // Pipe the image data to the response
    response.data.pipe(res);
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to proxy image',
      details: error.message
    });
  }
};

module.exports = {
  proxyImage
};
