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
      const data = fs.readFileSync(filePath, 'utf8');
      const player = JSON.parse(data);
      allPlayerNames.push(player.name);
    }
  }

  console.log('Player names loaded in controller:', allPlayerNames.length);
  return allPlayerNames;
}

function getAllPlayerNames() {
  return allPlayerNames;
}

function searchPlayers(query) {
  console.log('Searching among', allPlayerNames.length, 'players');
  const filteredNames = allPlayerNames.filter(name =>
    name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);
  return filteredNames;
}

module.exports = {
  loadPlayerNames,
  getAllPlayerNames,
  searchPlayers
};