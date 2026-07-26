const express = require("express");
const router = express.Router();
const multer = require('multer');
const bannercontroller = require('../controllers/banner.controller');

const storage = multer.memoryStorage(); // CHANGED: diskStorage se memoryStorage

const upload = multer({storage});

router.get('/',bannercontroller.getALLbanners);
router.get('/all',bannercontroller.getALLbannersAdmin);
router.post('/',upload.single('image'),bannercontroller.createbanner);
router.put('/:id',upload.single('image'),bannercontroller.updatebanner);
router.delete('/:id',bannercontroller.deleteBanner);

module.exports = router