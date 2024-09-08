const fs = require('fs');
const path = require('path');

let allPlayerNames = [];

function loadPlayerNames() {
  const playerDir = path.join(__dirname, '..', 'data', 'players');
  const files = fs.readdirSync(playerDir);

  allPlayerNames = [];

  for (const file of files) {
    if (path.extname(file) === '.json') {
      const filePath = path.join(playerDir, file);
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        const player = JSON.parse(data);
        if (player && player[player.length - 1].name && typeof player[player.length - 1].name === 'string') {
          allPlayerNames.push(player.name);
        } else {
          console.warn(`Invalid player data in file: ${file}`);
        }
      } catch (error) {
        console.error(`Error reading player file ${file}:`, error);
      }
    }
  }

  console.log('Player names loaded in controller:', allPlayerNames.length);
  return allPlayerNames;
}

function getAllPlayerNames() {
  return allPlayerNames;
}


function searchPlayers(query) {
  if (!query || typeof query !== 'string') {
    console.warn('Invalid search query:', query);
    return [];
  }

  console.log('Searching among', allPlayerNames.length, 'players');
  const filteredNames = allPlayerNames.filter(name => {
    console.log(name)
    if (name && typeof name === 'string') {
      return name.toLowerCase().includes(query.toLowerCase());
    }
    console.warn('Invalid player name encountered:', name);
    return false;
  }).slice(0, 10);

  return filteredNames;
}

module.exports = {
  loadPlayerNames,
  getAllPlayerNames,
  searchPlayers
};