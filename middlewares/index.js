const User = require("../models/userModel")
const Bet = require("../models/betModel")
const Game = require("../models/gameModel")
const bycrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const validateRegister = async(req,res,next)=> {
    try{
        const {email, password, firstname, lastname,age} = req.body
        
        const errors = []
        //validate email
        if(!firstname ){
            errors.push("please input your Firstname")
        }
        if(!lastname ){
            errors.push("please input your Lastname")
        }
        if(!email){
            errors.push("please input your Email address")
        }
        //validate Password
        if(!password){
            errors.push("please input your password")
        }
        //validate password length
        if(password.length < 6){
            errors.push("Your password should not be less than 6 characters")
        }
        //validate user age 
        if(age < 18){
            errors.push("You are underaged and cannot register")
        }

        //validate if user already exists
        const existingUser = await User.findOne({email})

        if(existingUser){
            errors.push("User Account Already Exists")

        }


        if(errors.length > 0){

            return res.status(400).json({message: errors})
        }


        next()
    }

    catch (error) {
        return res.status(500).json({message: error.message})
    }
        
        
      
}

const validateLogin = async(req,res,next)=>{

    try {
            const {email, password} = req.body

            
            if(!email){
                return res.status(404).json({message:"Please enter your Email "})

            }
            if(!password){
                return res.status(404).json({message:"Please enter your Password "})

            }
            const user = await User.findOne({email})

            if(!user){
                return res.status(404).json({message:"User Account does not Exist"})

            }

            const isMatch = await bycrypt.compare(password, user?.password)

            if(!isMatch){
                return res.status(400).json({message:"Incorrect Email or password"})

            }

            next()
        
    } catch (error) {
        return res.status(500).json({message: error.message})
        
    }
    
}

const validatePostGame = async(req,res,next)=>{
    const {league,hometeam,awayTeam,odds,gameDate,result} = req.body
        

    if(!league){
        return res.status(400).json({message:"Please input the league"})

    }
    if(!hometeam){
        return res.status(400).json({message:"Please input the home team"})

    }

    if(!awayTeam){
        return res.status(400).json({message:"Please input the away team"})

    }
    if(!gameDate){
        return res.status(400).json({message:"Please input the Game date and time "})

    }
    const findGame = await Game.findOne({hometeam,awayTeam,gameDate})

    if(findGame){
        return res.status(400).json({message:"Game already exist"})


    }
    next()
}

const validatePlaceBet = async (req,res,next)=>{
    const {gameId, stake, option} =req.body
        const user = req.user
        // console.log(test);
            
    
        // const user = await User.findById(userId)
    
        if(!user) {
            return res.status(404).json({message: "user not Found"})
        }
    
        const game = await Game.findById(gameId)
        if(!game) {
            return res.status(404).json({message: "Game not Found"})
        }
        if(!stake) {
            return res.status(400).json({message: "Stake must be a valid number"})
        }
        if( option !== "home" && option !== "away" && option !== "draw") {
            return res.status(400).json({message: "Invalid bet option"})
        }
    
        if (user.walletBalance < stake){
            return res.status(400).json({message: "Insufficient Balance"})
    
        }

        next()

}

const authorization = async (req,res, next)=>{
    try {
        const token = req.header("Authorization")  || req.header.authorization

        if (!token){
            return res.status(401).json({message: "Please Login"})
        }
        
        
        const splitToken = token.split(" ")
        

        const realToken = splitToken[1]
        

        const decoded = jwt.verify(realToken,`${process.env.ACCESS_TOKEN}`)
        
        if(!decoded){
            return res.status(401).json({message: "Please Login"})
        }

        const user = await User.findById(decoded.id)

        if(!user){
            return res.status(404).json({message: "User account does not exist"})

        }

        req.user = user
        next()
        
    } catch (error) {
        return res.status(500).json({message: error.message})
    }
    

}


const adminAuthorization = async(req,res, next)=>{
    try {
        const token = req.header("Authorization")  || req.header.authorization

        if (!token){
            return res.status(401).json({message: "Please Login"})
        }
        
        
        const splitToken = token.split(" ")
        

        const realToken = splitToken[1]
        

        const decoded = jwt.verify(realToken,`${process.env.ACCESS_TOKEN}`)
        
        if(!decoded){
            return res.status(401).json({message: "Please Login"})
        }

        const user = await User.findById(decoded.id)

        if(!user){
            return res.status(404).json({message: "User account does not exist"})

        }
        
        if (user?.role !== "admin"){
        return res.status(401).json({message: "invalid Authorization"})
        
    }
     // req.user = user
     next()

    } catch (error) {
        return res.status(500).json({message: error.message})
    }
     
} 


const validatePostResult = async (req,res,next)=>{
    const {gameId} = req.params
    const {result}= req.body
    const game = await Game.findById(gameId)

    if (!game){
        return res.status(404).json({message: "Game not Found"})

    }
    if (!result){
        return res.status(404).json({message: "Please insert a result "})

    }
    next()


}

const validateProcessPayment = async (req,res,next)=>{
    const bet = await Bet.find({ outcome: 'pending' }) 
    const game = await Game.findById(bet.game) 
    if (!game || game.result === '0:0') {
            return res.status(400).json({
                message: "Game not Fount or Game not updated" 
    })}
    next()
}

const validateGetResult = async (req,res,next)=>{
    const gameResult = await Game.find()
    if (!gameResult) 
    return res.status(400).json({
        message: "Game not Fount " 
    })
    next()

}

const validateBank = async (req,res,next)=>{
    const country = req.params.country.toUpperCase(); 
    if (!country) 
        return res.status(400).json({
            message: "COuntry not found " 
        })
    next()

}

module.exports = {
validateRegister,
validateLogin,
authorization,
adminAuthorization,
validatePostGame,
validatePlaceBet,
validatePostResult,
validateProcessPayment,
validateGetResult,
validateBank

}