const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose')
const moment = require('moment-timezone')

/**
 * router.get('/')
 */
async function getHomePage(req, res, draftType) {
    console.log('Loading home page...')
    res.status(200).render('home', {
        layout: 'main',
    })
}

async function loadPlayerNames() {
    const playerDir = path.join(__dirname, '..', 'data', 'players');
    const files = fs.readdirSync(playerDir);
  
    for (const file of files) {
      if (path.extname(file) === '.json') {
        const filePath = path.join(playerDir, file);
        const data = fs.readFileSync(filePath, 'utf8');
        const player = JSON.parse(data);
        allPlayerNames.push(player.name);
      }
    }
  }

module.exports.getHomePage = getHomePage;
module.exports.loadPlayerNames = loadPlayerNames;