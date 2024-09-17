const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');
const moment = require('moment-timezone')

const Player = require('../models/Player.js');

/**
 * router.get('/')
 */
async function getHomePage(req, res) {
    console.log('Loading home page...')
    let allPlayers = await Player.find({}).lean().exec();
    allPlayers = allPlayers.filter(player => player.position === 'QB' || player.position === 'WR' || player.position === 'RB' || player.position === 'TE')
    
    res.status(200).render('home', {
        layout: 'main',
        // table: createTableFromArray(allPlayers, 'players'),
        players: allPlayers,
    })


}

function createTableFromArray(arr, type) {
    let html = '<table id="playerTable" class="table table-striped">';
    html += '<thead><tr>';

    let headers = ['Player', 'Passing Stats', 'Rushing Stats', 'Receiving Stats', 'Fantasy Points (PPR)'];
    headers.forEach(key => html += `<th scope="col">${key}</th>`);


    switch (type) {
        case 'players':
            let categories = ['passing', 'receiving_and_rushing', 'rushing_and_receiving'];
            html += '</tr></thead><tbody>';

            arr.forEach((player, index) => {
                let receivingSeasons = [];
                let rushingSeasons = [];
                let passingSeasons = [];
                let fantasySeasons = [];

                if (index < 25) {
                    /**add player name */
                    switch (player.position) {
                        case 'QB':
                        case 'RB':
                        case 'WR':
                        case 'TE':
                            html += `<tr class="${index % 2 === 0 ? 'table-active' : ''}">`;
                            html += `<td class="text-center" data-category="player-name">${player.name}</td>`;
                            for (var i = 0; i < player.stats.length; i++) {
                                let currentStatGroup = player.stats[i];

                                if (categories.includes(currentStatGroup.category)) {
                                    switch (currentStatGroup.category) {
                                        // case 'detailed_receiving_and_rushing':
                                        case 'receiving_and_rushing':
                                            for (let r = 0; r < currentStatGroup.rows.length; r++) {
                                                let season = currentStatGroup.rows[r];
                                                if (season.targets > 0) {
                                                    receivingSeasons.push(`<p data-player="${player.name}" data-year="${season.year_id}" data-team="${season.team}" data-stat-type="receiving">${season.rec}-${season.rec_yds}-${season.rec_td}</p>`);
                                                }

                                                if (season.rush_att > 0) {
                                                    rushingSeasons.push(`<p data-player="${player.name}" data-year="${season.year_id}" data-team="${season.team}" data-stat-type="receiving">${season.rush_att}-${season.rush_yds}-${season.rush_td}</p>`);
                                                }

                                            }

                                            break;
                                        case 'rushing_and_receiving':
                                            if (rushingSeasons.length === 0) {
                                                for (let r = 0; r < currentStatGroup.rows.length; r++) {
                                                    let season = currentStatGroup.rows[r];
                                                    if (season.targets > 0) {
                                                        receivingSeasons.push(`<p data-player="${player.name}" data-year="${season.year_id}" data-team="${season.team}" data-stat-type="receiving">${season.rec}-${season.rec_yds}-${season.rec_td}</p>`);
                                                    }

                                                    if (season.rush_att > 0) {
                                                        rushingSeasons.push(`<p data-player="${player.name}" data-year="${season.year_id}" data-team="${season.team}" data-stat-type="receiving">${season.rush_att}-${season.rush_yds}-${season.rush_td}</p>`);
                                                    }

                                                }
                                            }
                                            break;
                                        case 'passing':
                                            for (let r = 0; r < currentStatGroup.rows.length; r++) {
                                                let season = currentStatGroup.rows[r];
                                                if (season.pass_att > 0) {
                                                    passingSeasons.push(`<p data-player="${player.name}" data-year="${season.year_id} data-team="${season.team_name_abbr}" data-stat-type="receiving">${season.pass_att}-${season.pass_yds}-${season.pass_td}</p>`);
                                                }

                                            }
                                            break;
                                    }
                                }
                            }

                            html += `<td class="text-center" data-category="passing-stats">${passingSeasons.join('\n')}</td>`
                            html += `<td class="text-center" data-category="rushing-stats">${rushingSeasons.join('\n')}</td>`
                            html += `<td class="text-center" data-category="receiving-stats">${receivingSeasons.join('\n')}</td>`
                            html += `<td class="text-center" data-category="fantasy-stats">${fantasySeasons.join('\n')}</td>`
                            html += '</tr>';
                            break;
                    }
                }
            });

            break;
    }

    html += '</tbody></table>';
    return html;
}

async function countPlayers() {
    try {
        const count = await Player.countDocuments();
        console.log(`Total number of players in the database: ${count}`);
    } catch (error) {
        console.error('Error counting players:', error);
    }
}

// Call this function to check how many players are found in database
// countPlayers();

module.exports.getHomePage = getHomePage;