const express = require('express');
const router = express.Router();

const { addAddress, getMyAddresses, getAddressById } = require('../controllers/Addresses.controller');
const { verifyToken } = require('../middleware/authMiddleware');

// Save a new delivery address for the logged-in user
router.post('/', verifyToken, addAddress);

// Get all saved addresses for the logged-in user
router.get('/', verifyToken, getMyAddresses);

// Get one specific address by ID (used by the Order Summary page)
router.get('/:addressId', verifyToken, getAddressById);

module.exports = router;