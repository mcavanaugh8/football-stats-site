const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');
const moment = require('moment-timezone')

const dbServices = require('../controllers/dbServices');
const { defenseStats } = require('../teamStats')

const currentYear = new Date().getFullYear();
const septemberFirst = new Date(`${currentYear}-09-01`);
const currentDate = new Date();

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

/**
 * router.get('/matchup-data')
 */
async function getMatchupData(req, res) {
    console.log('Loading matchup data page...');

    let allPlayers = await dbServices.getPlayers(['QB', 'RB', 'WR', 'TE'])
    
    // const allPlayerFiles = fs.readdirSync(path.resolve('.', 'testData', 'players'));
    // const folderPath = path.resolve('.', 'testData', 'players');
    // let allPlayers = [];
    // for (const file of allPlayerFiles) {
    //     if (file !== '.DS_Store') {
    //         let data = fs.readFileSync(path.join(folderPath, file), 'utf8');
    //         allPlayers.push(JSON.parse(data))
    //     }
    // }
    // const overallMatchupDataTable = createMatchupData([allPlayers], 'overall')

    const overallMatchupDataTable = createMatchupData(allPlayers, 'overall')
    const wrMatchupDataTable = createMatchupData(allPlayers.filter(player => player.position === 'WR'), 'WR')

    res.status(200).render('matchup-data', {
        layout: 'main',
        players: allPlayers,
        overallMatchupDataTable: overallMatchupDataTable,
        wrMatchupDataTable: wrMatchupDataTable,
    })
}

/**
 * router.get('/betting-lines')
 */

async function getBettingLines(req, res) {
    console.log('Loading betting lines page...');

    let allPlayers = await dbServices.getPlayers(['QB', 'RB', 'WR', 'TE']);
    let passingTable = createBettingLinesTable(allPlayers, 'passing');
    let rushingTable = createBettingLinesTable(allPlayers, 'rushing');
    let receivingTable = createBettingLinesTable(allPlayers, 'receiving');
    let receptionsTable = createBettingLinesTable(allPlayers, 'receptions');

    res.status(200).render('betting-lines', {
        layout: 'main',
        players: allPlayers,
        passingTable,
        rushingTable,
        receivingTable,
        receptionsTable,
    })
}


function createMatchupData(arr, type) {
    const teams = [
        'atl',
        'buf',
        'car',
        'chi',
        'cin',
        'cle',
        'ind',
        'ari',
        'dal',
        'den',
        'det',
        'gnb',
        'hou',
        'jax',
        'kan',
        'mia',
        'min',
        'nor',
        'nwe',
        'nyg',
        'nyj',
        'ten',
        'phi',
        'pit',
        'lvr',
        'lar',
        'bal',
        'lac',
        'sea',
        'sf',
        'tam',
        'was'];

    let html = '';
    let headers;

    switch (type) {
        case 'overall':
            html = `<table id="overall-matchup-data-table" class="table table-striped display">`;
            html += '<thead><tr>';

            headers = ['Team', 'Receptions', 'Rec Yards', 'Rec TD', 'Rushes', 'Rush Yards', 'Rush TD', 'Pass Completions', 'Pass Yards', 'Pass TD'];
            headers.forEach(key => html += `<th scope="col">${key}</th>`);
            html += '<tbody>';

            defenseStats.forEach(team => {
                html += '<tr>';

                headers.forEach((category, index) => {
                    if (index === 0) {
                        html += `<td class="team-name" data-threshold="${team.team}">${team.team}</td>`;
                    } else {

                        switch (category) {
                            case 'Receptions':
                            case 'Pass Completions':
                                html += `<td data-threshold="pass_cmp">${team.pass_cmp}</td>`;
                                break;
                            case 'Rec Yards':
                            case 'Pass Yards':
                                html += `<td data-threshold="pass_yds">${team.pass_yds}</td>`;
                                break;
                            case 'Pass TD':
                            case 'Rec TD':
                                html += `<td data-threshold="pass_td">${team.pass_td}</td>`;
                                break;
                            case 'Rush Yards':
                                html += `<td data-threshold="rush_yds">${team.rush_yds}</td>`;
                                break;
                            case 'Rushes':
                                html += `<td data-threshold="rush_arr">${team.rush_att}</td>`;
                                break;
                            case 'Rush TD':
                                html += `<td data-threshold="rush_td">${team.rush_td}</td>`;
                                break;
                        }
                    }
                });
                html += '</tr>';
            })

            html += '</tbody></table>';
            break;
        case 'WR':
            html = `<table id="wr-matchup-data-table" class="table table-striped display">`;
            html += '<thead><tr>';

            headers = ['Team', 'Receptions', 'Deviation', 'Rec Yards', 'Deviation', 'Rec TD', 'Deviation'];
            headers.forEach(key => html += `<th scope="col">${key}</th>`);
            html += '<tbody>';

            teams.forEach(team => {
                // console.log(team)
                const teamDefenseObj = defenseStats.find(item => item.team == getTeamByAbbreviation(team));
                // console.log(teamDefenseObj)
                html += '<tr>';
                html += `<td class="team-name" data-team="${getTeamByAbbreviation(team)}">${getTeamByAbbreviation(team)}</td>`;
                html += `<td data-threshold="rec-allowed">${Math.floor(Number(teamDefenseObj['pass_cmp']) / Number(teamDefenseObj['g']))}</td>`;
                html += `<td data-threshold="rec-deviation">${calculateTeamDeviation(arr, currentYear, team, 'rec')}</td>`;
                html += `<td data-threshold="rec-yd-allowed">${Math.floor(Number(teamDefenseObj['pass_yds']) / Number(teamDefenseObj['g']))}</td>`;
                html += `<td data-threshold="rec-yd-deviation">${calculateTeamDeviation(arr, currentYear, team, 'rec_yds')}</td>`;
                html += `<td data-threshold="rec-td-allowed">${Math.round(Number(teamDefenseObj['pass_td']) / Number(teamDefenseObj['g']) * 100) / 100}</td>`;
                html += `<td data-threshold="rec-td-deviation"> ${calculateTeamDeviation(arr, currentYear, team, 'rec_td')}</td>`;
                html += '</tr>';
            })

            html += '</tbody></table>';
            break;
    }

    return html;
}

function calculateTeamDeviation(arr, currentYear, team, stat) {

    let totalDeviation = 0;
    let playerCount = 0;

    arr.forEach(player => {
        if (player.name === 'Aaron Rodgers') {
            console.log(player)
        }

        if (player.gameLogsByYear) {
            const yearGames = player.gameLogsByYear[String(currentYear)];

            if (yearGames && yearGames.length > 0) {
                try {
                    const filteredGames = yearGames.filter(game => {
                        const gameDate = new Date(game.game_date);
                        return gameDate >= septemberFirst && gameDate <= currentDate;
                    });
            
                    filteredGames.forEach(game => {
                        if (game.opp.toLowerCase() === team) {
                            const playerAvgStat = player.averages[`avg_${stat}`];
                            const gameStat = game[stat];
            
                            if (playerAvgStat && gameStat !== undefined) {
                                totalDeviation += (gameStat - playerAvgStat);
                                playerCount++;
                            }
                        }
                    });
                } catch (e) {
                    console.log(`error with: ${player.name}... skipping`)
                    // console.log(player)
                    // console.log(e)
                }
            }
        }

    });

    return playerCount > 0 ? (totalDeviation / playerCount).toFixed(2) : 0;
}

function createBettingLinesTable(arr, stat) {

    let html = `<table id="${stat !== 'receptions' ? stat + '-yards' : stat}-table" class="table table-striped display">`;
    html += '<thead><tr>';
    let headers;

    switch (stat) {
        case 'passing':
            headers = ['Player', '100+', '125+', '150+', '175+', '200+', '225+', '250+', '275+', '300+'];
            headers.forEach(key => html += `<th scope="col">${key}</th>`);
            html += '<tbody>';

            arr.forEach(player => {
                try {
                    if (player.gameLogsByYear && player.gameLogsByYear[String(currentYear)] !== undefined) {
                        const yearGames = player.gameLogsByYear[String(currentYear)];

                        const filteredGames = yearGames.filter(game => {
                            const gameDate = new Date(game.game_date);
                            return gameDate >= septemberFirst && gameDate <= currentDate;
                        });

                        let gamesPlayed = filteredGames.length;

                        if (gamesPlayed > 0) {
                            switch (player.position) {
                                case 'QB':
                                    html += '<tr>';
                                    headers.forEach((category, index) => {
                                        if (index === 0) {
                                            html += `<td data-threshold="${category.replace(/\+/, '_or_more')}">${player.name}</td>`;
                                        } else {
                                            let results = countHits(filteredGames, category, 'pass_yds', player.name);
                                            html += returnHitsCellContent(results, category)
                                        }
                                    });
                                    html += '</tr>';
                                    break;
                            }

                        }
                    }
                } catch (e) {
                    console.error('Error with ' + player.name + '\n' + e)
                }
            });
            break;
        case 'rushing':
            headers = ['Player', '25+', '30+', '35+', '40+', '45+', '50+', '55+', '60+', '65+', '70+', '75+', '80+', '85+', '90+', '95+', '100+', '125+', '150+'];
            headers.forEach(key => html += `<th scope="col">${key}</th>`);

            html += '<tbody>';
            arr.forEach(player => {
                try {
                    if (player.gameLogsByYear && player.gameLogsByYear[String(currentYear)] !== undefined) {
                        const yearGames = player.gameLogsByYear[String(currentYear)];

                        const filteredGames = yearGames.filter(game => {
                            const gameDate = new Date(game.game_date);
                            return gameDate >= septemberFirst && gameDate <= currentDate;
                        });

                        let gamesPlayed = filteredGames.length;

                        if (gamesPlayed > 0) {

                            switch (player.position) {
                                case 'RB':
                                case 'QB':
                                    html += '<tr>';
                                    headers.forEach((category, index) => {
                                        if (index === 0) {
                                            html += `<td data-threshold="${category.replace(/\+/, '_or_more')}">${player.name}</td>`;
                                        } else {
                                            let results = countHits(filteredGames, category, 'rush_yds', player.name);
                                            html += returnHitsCellContent(results, category)
                                        }
                                    });
                                    html += '</tr>';
                                    break;
                            }

                        }
                    }
                } catch (e) {
                    console.error('Error with ' + player.name + '\n' + e)
                }
            });
            break;
        case 'receiving':
            headers = ['Player', '25+', '30+', '35+', '40+', '45+', '50+', '55+', '60+', '65+', '70+', '75+', '80+', '85+', '90+', '95+', '100+', '125+', '150+'];
            headers.forEach(key => html += `<th scope="col">${key}</th>`);
            html += '<tbody>';

            arr.forEach(player => {
                try {
                    if (player.gameLogsByYear && player.gameLogsByYear[String(currentYear)] !== undefined) {
                        const yearGames = player.gameLogsByYear[String(currentYear)];

                        const filteredGames = yearGames.filter(game => {
                            const gameDate = new Date(game.game_date);
                            return gameDate >= septemberFirst && gameDate <= currentDate;
                        });

                        let gamesPlayed = filteredGames.length;

                        if (gamesPlayed > 0) {

                            switch (player.position) {
                                case 'WR':
                                case 'RB':
                                case 'TE':
                                    html += '<tr>';
                                    headers.forEach((category, index) => {
                                        if (index === 0) {
                                            html += `<td data-threshold="${category.replace(/\+/, '_or_more')}">${player.name}</td>`;
                                        } else {
                                            let results = countHits(filteredGames, category, 'rec_yds', player.name);
                                            html += returnHitsCellContent(results, category)
                                        }
                                    });
                                    html += '</tr>';
                                    break;
                            }


                        }
                    }
                } catch (e) {
                    console.error('Error with ' + player.name + '\n' + e)
                }
            });
            break;
        case 'receptions':
            headers = ['Player', '1+', '2+', '3+', '4+', '5+', '6+', '7+', '8+', '9+', '10+'];
            headers.forEach(key => html += `<th scope="col">${key}</th>`);
            html += '<tbody>';

            arr.forEach(player => {
                try {
                    if (player.gameLogsByYear && player.gameLogsByYear[String(currentYear)] !== undefined) {
                        const yearGames = player.gameLogsByYear[String(currentYear)];

                        const filteredGames = yearGames.filter(game => {
                            const gameDate = new Date(game.game_date);
                            return gameDate >= septemberFirst && gameDate <= currentDate;
                        });

                        let gamesPlayed = filteredGames.length;

                        if (gamesPlayed > 0) {
                            switch (player.position) {
                                case 'WR':
                                case 'RB':
                                case 'TE':
                                    html += '<tr>';
                                    headers.forEach((category, index) => {
                                        if (index === 0) {
                                            html += `<td data-threshold="${category.replace(/\+/, '_or_more')}">${player.name}</td>`;
                                        } else {
                                            let results = countHits(filteredGames, category, 'rec', player.name);
                                            html += returnHitsCellContent(results, category)
                                        }
                                    });
                                    html += '</tr>';
                                    break;
                            }

                        }
                    }
                } catch (e) {
                    console.error('Error with ' + player.name + '\n' + e)
                }
            });
            break;
    }

    html += '</tbody></table>';
    return html;
}

function returnHitsCellContent(results, category) {
    let str = '';

    if (results.percentage === 100) {
        str += `<td class="perfect-hit-rate" data-threshold="${category.replace(/\+/, '_or_more')}">${results.message}</td>`;
    } else if (results.percentage >= 75 && results.percentage < 100) {
        str += `<td class="strong-hit-rate" data-threshold="${category.replace(/\+/, '_or_more')}">${results.message}</td>`;
    } else if (results.percentage >= 60 && results.percentage < 75) {
        str += `<td class="moderate-hit-rate" data-threshold="${category.replace(/\+/, '_or_more')}">${results.message}</td>`;
    } else if (results.percentage >= 50 && results.percentage < 60) {
        str += `<td class="weak-hit-rate" data-threshold="${category.replace(/\+/, '_or_more')}">${results.message}</td>`;
    } else if (results.percentage === 0) {
        str += `<td class="no-hit-rate" data-threshold="${category.replace(/\+/, '_or_more')}">${results.message}</td>`;
    } else {
        str += `<td class="very-bad-hit-rate" data-threshold="${category.replace(/\+/, '_or_more')}">${results.message}</td>`;
    }

    return str;
}

function countHits(yearGames, category, stat, playerName) {
    let hits = 0;

    for (let i = 0; i < yearGames.length; i++) {
        let currentGame = yearGames[i];

        if (playerName === '') {
            // console.log(stat)
            if (category.match(/\+/)) {
                let threshold = parseInt(category.match(/\d{1,3}/)[0], 10);
                console.log(currentGame[stat], threshold);
                if (currentGame[stat] >= threshold) {
                    console.log('hit');
                }

                currentGame[stat] >= threshold ? hits++ : false;
            } else {
                let lower = parseInt(category.split('-')[0], 10);
                let upper = parseInt(category.split('-')[1], 10);
                console.log(currentGame[stat], lower, upper);
                if (currentGame[stat] >= lower && currentGame[stat] <= upper) {
                    console.log('hit');
                }

                (currentGame[stat] >= lower && currentGame[stat] <= upper) ? hits++ : false;
            }
        } else {
            if (category.match(/\+/)) {
                let threshold = parseInt(category.match(/\d{1,3}/)[0], 10);
                currentGame[stat] >= threshold ? hits++ : false;
            } else {
                let lower = parseInt(category.split('-')[0], 10);
                let upper = parseInt(category.split('-')[1], 10);
                (currentGame[stat] >= lower && currentGame[stat] <= upper) ? hits++ : false;
            }
        }
    }

    return {
        message: `${hits}/${yearGames.length} (${Math.round((hits / yearGames.length) * 100)}%)`,
        percentage: Math.round((hits / yearGames.length) * 100),
        hits: hits
    };
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

function formatTeamCells(playerCard) {
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

function calculateDeviation(playerAvg, gameStat) {
    return (playerAvg - gameStat).toFixed(2);
}

function calculateTeamEffect(teamAvg, playerAvg) {
    return (teamAvg - playerAvg).toFixed(2);
}

function findAverage(arr) {
    return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
}

function getTeamByAbbreviation(str) {
    let team = '';
    switch (str.toUpperCase()) {
        case 'JAX':
            team = 'Jacksonville Jaguars'
            break;
        case 'NYJ':
            team = 'New York Jets';
            break;
        case 'SF':
            team = 'San Francisco 49ers';
            break;
        case 'ATL':
            team = 'Atlanta Falcons';
            break;
        case 'CIN':
            team = 'Cincinnati Bengals';
            break;
        case 'MIA':
            team = 'Miami Dolphins';
            break;
        case 'DET':
            team = 'Detroit Lions';
            break;
        case 'CAR':
            team = 'Carolina Panthers';
            break;
        case 'DEN':
            team = 'Denver Broncos';
            break;
        case 'DAL':
            team = 'Dallas Cowboys';
            break;
        case 'NYG':
            team = 'New York Giants';
            break;
        case 'PHI':
            team = 'Philadelphia Eagles';
            break;
        case 'LAC':
            team = 'Los Angeles Chargers';
            break;
        case 'MIN':
            team = 'Minnesota Vikings';
            break;
        case 'NE':
        case 'NWE':
            team = 'New England Patriots';
            break;
        case 'ARI':
            team = 'Arizona Cardinals';
            break;
        case 'LV':
        case 'LVR':
            team = 'Las Vegas Raiders';
            break;
        case 'WAS':
            team = 'Washington Commanders';
            break;
        case 'CHI':
            team = 'Chicago Bears';
            break;
        case 'IND':
            team = 'Indianapolis Colts';
            break;
        case 'TEN':
            team = 'Tennessee Titans';
            break;
        case 'PIT':
            team = 'Pittsburgh Steelers';
            break;
        case 'CLE':
            team = 'Cleveland Browns';
            break;
        case 'BAL':
            team = 'Baltimore Ravens';
            break;
        case 'NO':
        case 'NOR':
            team = 'New Orleans Saints';
            break;
        case 'GB':
        case 'GNB':
            team = 'Green Bay Packers';
            break;
        case 'BUF':
            team = 'Buffalo Bills';
            break;
        case 'HOU':
        case 'HTX':
            team = 'Houston Texans';
            break;
        case 'KC':
        case 'KAN':
            team = 'Kansas City Chiefs';
            break;
        case 'LAR':
            team = 'Los Angeles Rams';
            break;
        case 'TB':
        case 'TAM':
            team = 'Tampa Bay Buccaneers';
            break;
        case 'SEA':
            team = 'Seattle Seahawks';
            break;
    }

    return team;
}

// Call this function to check how many players are found in database
// countPlayers();

module.exports.getHomePage = getHomePage;
module.exports.getPlayersPage = getPlayersPage;
module.exports.getBettingLines = getBettingLines;
module.exports.getMatchupData = getMatchupData;