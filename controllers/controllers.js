const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');
const moment = require('moment-timezone')

const dbServices = require('../controllers/dbServices');

/**
 * router.get('/')
 */
async function getHomePage(req, res) {
    console.log('Loading home page...');

    // let allPlayers = await dbServices.getPlayers();
    // console.log(allPlayers)

    res.status(200).render('home', {
        layout: 'main',
        // players: allPlayers
    })
}

/**
 * router.get('/players')
 */
async function getPlayersPage(req, res) {
    console.log('Loading players page...');

    let allPlayers = await dbServices.getPlayers(['QB', 'RB', 'WR', 'TE'])
    // fs.writeFileSync(path.resolve('.', 'test', 'example.json'), JSON.stringify(allPlayers.find(player => player.name === 'Justin Fields')));
    // console.log(allPlayers.find(player => player.name === 'Justin Fields'))

    res.status(200).render('players', {
        layout: 'main',
        players: allPlayers
    })
}

function getStats(player) {
    for (let item in player) {
        const relevantStats = [];
        switch (item) {
            case 'gameLogs':
                switch (player.position) {
                    case 'QB':
                        console.log(player.name)
                        relevantStats.push(
                            'advanced_passing',
                            'advanced_rushing_and_receiving',
                            'advanced_receiving_and_rushing',
                        )
                        break;
                    case 'TE':
                    case 'WR':
                    case 'RB':
                        relevantStats.push(
                            'advanced_rushing_and_receiving',
                            'advanced_receiving_and_rushing',
                        )
                        break;
                }

                for (var i = 0; i < player[item].length; i++) {
                    let category = player[item][i].category;
                    let games = player[item][i];

                    if (relevantStats.includes(category)) {
                        // console.log(games);
                        return games;
                    }
                }
                break;
        }
    }
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

function formatPlayerCards(playerCard) {
    switch (playerCard.team) {
        case 'JAX':
            playerCard.backgroundColor = '#45818e';
            playerCard.color = '#f1c232';
            playerCard.fontWeight = 'bolder';
            break;
        case 'NYJ':
            playerCard.backgroundColor = '#38761d';
            playerCard.color = '#fff';
            playerCard.fontWeight = 'bolder';
            break;
        case 'SF':
            playerCard.backgroundColor = '#ff0000';
            playerCard.color = '#ffd966';
            playerCard.fontWeight = 'bolder';
            break;
        case 'ATL':
            playerCard.backgroundColor = '#000000';
            playerCard.color = '#a71930';
            playerCard.fontWeight = 'bolder';
            break;
        case 'CIN':
            playerCard.backgroundColor = '#ff6e07';
            playerCard.color = '#000000';
            playerCard.fontWeight = 'bolder';
            break;
        case 'MIA':
            playerCard.backgroundColor = '#00ffff';
            playerCard.color = '#ff6e07';
            playerCard.fontWeight = 'bolder';
            break;
        case 'DET':
            playerCard.backgroundColor = '#3d85c6';
            playerCard.color = '#efefef';
            playerCard.fontWeight = 'bolder';
            break;
        case 'CAR':
            playerCard.backgroundColor = '#23b8ff';
            playerCard.color = '#000000';
            playerCard.fontWeight = 'bolder';
            break;
        case 'DEN':
            playerCard.backgroundColor = '#ff8b07';
            playerCard.color = '#002b62';
            playerCard.fontWeight = 'bolder';
            break;
        case 'DAL':
            playerCard.backgroundColor = '#FFF';
            playerCard.color = '#042f6a';
            playerCard.fontWeight = 'bolder';
            break;
        case 'NYG':
            playerCard.backgroundColor = '#1155cc';
            playerCard.color = '#FFF';
            playerCard.fontWeight = 'bolder';
            break;
        case 'PHI':
            playerCard.backgroundColor = '#274e13';
            playerCard.color = '#FFF';
            playerCard.fontWeight = 'bolder';
            break;
        case 'LAC':
            playerCard.backgroundColor = '#11a1ff';
            playerCard.color = '#f1c232';
            playerCard.fontWeight = 'bolder';
            playerCard.fontSize = '0.9rem';
            break;
        case 'MIN':
            playerCard.backgroundColor = '#351c75';
            playerCard.color = '#ffff00';
            playerCard.fontWeight = 'bolder';
            break;
        case 'NE':
            playerCard.backgroundColor = '#000d4d';
            playerCard.color = '#ff0000';
            playerCard.fontWeight = 'bolder';
            break;
        case 'ARI':
            playerCard.backgroundColor = '#cc0000';
            playerCard.color = '#FFF';
            playerCard.fontWeight = 'bolder';
            break;
        case 'LV':
            playerCard.backgroundColor = '#000000';
            playerCard.color = '#d9d9d9';
            playerCard.fontWeight = 'bolder';
            break;
        case 'WAS':
            playerCard.backgroundColor = '#990000';
            playerCard.color = '#f1c232';
            playerCard.fontWeight = 'bolder';
            break;
        case 'CHI':
            playerCard.backgroundColor = '#072253';
            playerCard.color = '#ff6e07';
            playerCard.fontWeight = 'bolder';
            break;
        case 'IND':
            playerCard.backgroundColor = '#001685';
            playerCard.color = '#FFF';
            playerCard.fontWeight = 'bolder';
            break;
        case 'TEN':
            playerCard.backgroundColor = '#6fa8dc';
            playerCard.color = '#073763';
            playerCard.fontWeight = 'bolder';
            break;
        case 'PIT':
            playerCard.backgroundColor = '#000000';
            playerCard.color = '#ffff00';
            playerCard.fontWeight = 'bolder';
            break;
        case 'CLE':
            playerCard.backgroundColor = '#6c3803';
            playerCard.color = '#ff6e07';
            playerCard.fontWeight = 'bolder';
            break;
        case 'BAL':
            playerCard.backgroundColor = '#2d1764';
            playerCard.color = '#FFF';
            playerCard.fontWeight = 'bolder';
            break;
        case 'NO':
            playerCard.backgroundColor = '#000000';
            playerCard.color = '#d5b11b';
            playerCard.fontWeight = 'bolder';
            break;
        case 'GB':
            playerCard.backgroundColor = '#274e13';
            playerCard.color = '#ffff00';
            playerCard.fontWeight = 'bolder';
            break;
        case 'BUF':
            playerCard.backgroundColor = '#1155cc';
            playerCard.color = '#ff0000';
            playerCard.fontWeight = 'bolder';
            break;
        case 'HOU':
            playerCard.backgroundColor = 'rgba(4,47,106,1)';
            playerCard.color = '#ff0000';
            playerCard.fontWeight = 'bolder';
            break;
        case 'KC':
            playerCard.backgroundColor = '#ff0000';
            playerCard.color = '#FFF';
            playerCard.fontWeight = 'bolder';
            break;
        case 'LAR':
            playerCard.backgroundColor = 'rgba(7,55,99,1)';
            playerCard.color = '#d5b11b';
            playerCard.fontWeight = 'bolder';
            break;
        case 'TB':
            playerCard.backgroundColor = 'rgba(204,65,37,1)';
            playerCard.color = '#FFF';
            playerCard.fontWeight = 'bolder';
            break;
        case 'SEA':
            playerCard.backgroundColor = 'rgba(0,34,68,1)';
            playerCard.color = 'rgba(105,190,40,1)';
            playerCard.fontWeight = 'bolder';
            break;
    }
}

async function isValidUrl(url) {
    try {
        const response = await axios.get(url);
        // If the status code is in the 200 range, the URL is valid
        return response.status === 200;
    } catch (error) {
        // If there's an error, the URL is likely invalid
        if (error.response) {
            console.log(`Request made but server responded with a status code: ${error.response.status}`);
        } else if (error.request) {
            console.log('Request made but no response was received.');
        } else {
            console.log('Error in setting up the request:', error.message);
        }
        return false;
    }
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
module.exports.getPlayersPage = getPlayersPage;