const express = require('express');
const router = express.Router();
const { proxyImage } = require('../controllers/imageProxyController');

// Proxy image route
router.get('/proxy', proxyImage);

module.exports = router;
