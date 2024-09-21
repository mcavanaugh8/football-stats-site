const express = require('express');
const router = express.Router();

const {
    getHomePage
} = require('../controllers/controllers.js')

router.get('/', async (req, res) => {
    getHomePage(req, res);
});

router.get('/players', async (req, res) => {
    getPlayers(req, res);
});

module.exports = router;