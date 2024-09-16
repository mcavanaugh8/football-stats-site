const express = require('express');
const router = express.Router();

const {
    getHomePage
} = require('../controllers/controllers.js')

router.get('/', async (req, res) => {
    getHomePage(req, res);
});

module.exports = router;