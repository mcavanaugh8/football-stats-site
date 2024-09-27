const Player = require('../models/Player.js');

let cachedPlayers = [];

async function loadPlayers() {
    cachedPlayers = await Player.find({}).lean().exec();
    return cachedPlayers;
}

async function getPlayers(positions) {
    let allPlayers = [];

    if (cachedPlayers.length === 0) {
        allPlayers = await loadPlayers();

        if (positions && positions.length > 0) {
            allPlayers = allPlayers.filter(player => positions.includes(player.position));
        }

        allPlayers.forEach(player => formatPlayerCards(player));
    } else {
        return cachedPlayers;
    }

    return allPlayers;
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

module.exports = {
    getPlayers,
}