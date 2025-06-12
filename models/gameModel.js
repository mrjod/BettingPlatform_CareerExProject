const mongoose = require("mongoose")

const gameSchema = new mongoose.Schema({
    league:{type: String, require: true},
    hometeam:{type: String, require: true},
    awayTeam:{type: String, require: true},
    odds:{
        home:{type: Number, default:0},
        away:{type: Number, default:0},
        draw:{type: Number, default:0}
    },
    result:{type: String, require: true, default: '0:0'},
    gameDate:{type:Date ,require: true }
    
    
}, {timestamps: true})


const Game = new mongoose.model("Game", gameSchema)

module.exports = Game