const express = require('express');
const router = express.Router();

const {
    getHomePage,
    getPlayersPage,
    getBettingLines,
} = require('../controllers/controllers.js')

router.get('/', async (req, res) => {
    getHomePage(req, res);
});

router.get('/players', async (req, res) => {
    getPlayersPage(req, res);
});

router.get('/betting-lines', async (req, res) => {
    getBettingLines(req, res);
});

module.exports = router;