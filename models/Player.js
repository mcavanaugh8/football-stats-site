const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: String,
    age: String,
    college: String,
    position: String,
    height: String,
    weight: String,
    stats: Array,
});

const Player = mongoose.model("Player", playerSchema);

module.exports = Player;