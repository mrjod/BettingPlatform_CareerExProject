const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    email:{type: String, require: true, unique: true},
    password:{type: String, require: true},
    firstname:{type: String, default: ""},
    lastname:{type: String, default: ""},
    age:{type: Number, default: 0},
    role:{type:String, default:"user"},
    walletBalance: {type: Number, default:0},
    verified:{type:Boolean, default:false}
}, {timestamps: true})


const User = new mongoose.model("User", userSchema)

module.exports = User