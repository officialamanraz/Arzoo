// routes/whatsappRoutes.js

const express = require('express');
const router = express.Router();

// Controller ko import karna
const { redirectWhatsApp } = require('../controllers/whatsapp');

// GET request ka route set karna
router.get('/redirect', redirectWhatsApp);

module.exports = router;