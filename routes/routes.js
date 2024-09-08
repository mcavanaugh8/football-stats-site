const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const passport = require('passport');
const puppeteer = require('puppeteer');

const {
    getHomePage,
} = require('../controllers/controllers.js')


router.get('/', (req, res) => {
    getHomePage(req, res)
});

module.exports = router;