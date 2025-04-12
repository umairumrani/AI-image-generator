const express = require('express');
const router = express.Router();
const { generateImage, getImageHistory } = require('../controllers/imageController');

// Generate image route
router.post('/generate', generateImage);

// Get image history route
router.get('/history', getImageHistory);

module.exports = router;
