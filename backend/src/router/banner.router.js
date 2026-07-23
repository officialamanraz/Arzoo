const express = require("express");
const router = express.Router();
const multer = require('multer');
const bannercontroller = require('../controllers/banner.controller');

const storage = multer.diskStorage({
    destination:(req,file,cb)=>cb(null,'uploads/'),
    filename:(req,file,cb)=>cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({storage});

router.get('/',bannercontroller.getALLbanners);
router.get('/all',bannercontroller.getALLbannersAdmin);
router.post('/',upload.single('image'),bannercontroller.createbanner);
router.put('/:id',upload.single('image'),bannercontroller.updatebanner);
router.delete('/:id',bannercontroller.deleteBanner);

module.exports = router