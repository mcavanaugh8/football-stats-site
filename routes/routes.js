const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const passport = require('passport');
const puppeteer = require('puppeteer');

const {
    getHomePage
} = require('../controllers/controllers.js');

const playerController = require('../controllers/playerController');

router.get('/', (req, res) => {
    res.render('home');
  });

router.get('/api/players', (req, res) => {
    try {
        const query = req.query.q;
        const filteredNames = playerController.searchPlayers(query);
        res.json(filteredNames);
    } catch (error) {
        console.error('Error in /api/players route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;