const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../controllers/Email');

router.post('/', sendContactEmail);

module.exports = router;