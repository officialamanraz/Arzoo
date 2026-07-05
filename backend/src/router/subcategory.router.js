const express = require('express');
const { verifyAdmin } = require('../middleware/authmiddleware');
const { getSubcategories, addSubcategory } = require('../controllers/subcategory.controller');

const router = express.Router();

router.get('/list', getSubcategories);
router.post('/add', verifyAdmin, addSubcategory);

module.exports = router;