const express = require('express');
const router = express.Router();
const { translatetext } = require('../controllers/translation.controller');

// This will create the POST route: https://arzoo-saree.onrender.com/api/translate
router.post('/', translatetext);

module.exports = router;