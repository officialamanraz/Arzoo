const express = require('express');
const router = express.Router();
const { translatetext } = require('../controllers/translation');
router.post('/', translatetext);

module.exports = router;