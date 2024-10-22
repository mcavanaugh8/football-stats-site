const express = require('express');
const router = express.Router();

const {
    getHomePage,
    getPlayersPage,
    getBettingLines,
    getMatchupData,
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

router.get('/matchup-data', async (req, res) => {
    getMatchupData(req, res);
});

module.exports = router;