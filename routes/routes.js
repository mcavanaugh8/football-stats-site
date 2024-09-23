const express = require('express');
const router = express.Router();

const {
    getHomePage,
    getPlayersPage
} = require('../controllers/controllers.js')

router.get('/', async (req, res) => {
    getHomePage(req, res);
});

router.get('/players', async (req, res) => {
    getPlayersPage(req, res);
});

module.exports = router;