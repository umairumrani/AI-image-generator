# AI Image Generator

A web application that generates images using AI based on text prompts.

## Features

- Generate AI images from text descriptions
- Server-side processing for optimal performance
- Download generated images
- Clean, responsive user interface
- No browser freezing or unresponsiveness

## Technologies Used

- **Backend**: Node.js, Express
- **Frontend**: HTML, CSS, JavaScript
- **API**: Stability AI API for image generation

## Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/ai-image-generator.git
cd ai-image-generator
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file in the root directory and add your Stability AI API key:
```
STABILITY_API_KEY=your_api_key_here
```

4. Start the server:
```
node server.js
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. Enter a text description of the image you want to generate
2. Click the "Generate Image" button
3. Wait for the image to be created (typically 15-30 seconds)
4. Use the "Download Image" button to save the generated image

## Project Structure

- `server.js` - Main server file that handles API requests
- `public/` - Contains static files served to the client
  - `index.html` - Main application page
- `public/` - Directory where generated images are stored

## License

MIT

## Acknowledgments

- [Stability AI](https://stability.ai/) for their image generation API
