const express = require('express')
const router = express.Router();

const {getMain, getSingle} = require('../controllers/viewsController')

router.get('/', getMain)
router.get('/single', getSingle)

module.exports = router;