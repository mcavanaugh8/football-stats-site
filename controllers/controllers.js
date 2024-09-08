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

module.exports.getHomePage = getHomePage;