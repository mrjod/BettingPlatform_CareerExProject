const mongoose = require("mongoose")

const betSchema = new mongoose.Schema({
    user: { type: String, required: true},
    game: { type: String, required: true },
    outcome: { type: String, default: 'pending' },
    stake: {type:Number, required: true},
    payout: {type:Number, default: 0},
    option: {type: String , required: true}
    
    
}, {timestamps: true})


const Bet = new mongoose.model("Bet", betSchema)

module.exports = Bet