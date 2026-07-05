const express = require('express');
const router = express.Router();

// 1. Controller ko import kiya
const locationController = require('../controllers/location.controller');

// 2. Sirf aur sirf FUNCTION pass karna hai, data nahi!
router.get('/states-districts', locationController.getStatesDistricts);

module.exports = router;