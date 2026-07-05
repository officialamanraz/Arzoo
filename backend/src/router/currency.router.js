const express = require('express');
const router = express.Router();

const {currencychange}=require("../controllers/currency.controller")

router.get('/Rate-change',currencychange);

module.exports=router
