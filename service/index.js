const User = require("../models/userModel")
const Game = require("../models/gameModel")


const getAllUserService = async ()=>{

    const allUser =  await User.find()

    return allUser

}
const getUserService = async (req)=>{

    const specificUser =  await User.findOne(req)

    return specificUser

}


module.exports = {
    getAllUserService,
    getUserService

}


