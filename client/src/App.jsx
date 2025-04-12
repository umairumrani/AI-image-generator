import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [prompt, setPrompt] = useState('')
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])

  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('imageHistory')
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory))
      }
    } catch (err) {
      console.error('Error loading history from localStorage:', err)
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('imageHistory', JSON.stringify(history))
    } catch (err) {
      console.error('Error saving history to localStorage:', err)
    }
  }, [history])

  // Generate image function
  const generateImage = async (e) => {
    e.preventDefault()

    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Stability AI API key
      const API_KEY = 'sk-lKVFlxV2g1QDr0wTPVwz9nzFEbmyH1SGIY1RytHAo9xgazTF'

      // Call Stability AI API directly
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
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
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `API request failed with status ${response.status}`)
      }

      const data = await response.json()

      // Extract the image from the response
      const imageData = data.artifacts[0]
      const imageUrl = `data:image/png;base64,${imageData.base64}`

      // Update UI with the generated image
      setImage(imageUrl)

      // Add to history
      const newHistoryItem = {
        id: Date.now(),
        prompt,
        imageUrl,
        timestamp: new Date().toISOString()
      }

      // Update history
      setHistory(prevHistory => [newHistoryItem, ...prevHistory])

    } catch (err) {
      console.error('Error generating image:', err)
      setError(err.message || 'Failed to generate image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-indigo-600 mb-2">AI Image Generator</h1>
        <p className="text-gray-600">Create stunning images with AI</p>
      </header>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={generateImage} className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a detailed description of the image you want to generate..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {error && <p className="mt-2 text-red-600">{error}</p>}
        </form>

        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
                <p className="ml-4 text-lg text-gray-700">Creating your image...</p>
              </div>
              <p className="text-sm text-gray-500 mt-4">This may take a moment</p>
            </div>
          ) : image ? (
            <div className="text-center">
              <img
                src={image}
                alt={prompt}
                className="mx-auto max-h-96 rounded-lg shadow-md"
              />
              <p className="mt-4 text-gray-700">{prompt}</p>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Your generated image will appear here</p>
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Generation History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.prompt}
                  className="w-full h-64 object-cover"
                />
                <div className="p-4">
                  <p className="text-gray-700 text-sm mb-2">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                  <p className="text-gray-900 font-medium">{item.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
