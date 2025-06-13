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
    try {
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
        
    } catch (error) {
        return res.status(500).json({message: error.message})
        
    }
    

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
    try {
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

    } catch (error) {
        return res.status(500).json({message: error.message})
        
    }



}

const validateProcessPayment = async (req,res,next)=>{

    try {
        const bet = await Bet.find({ outcome: 'pending' }) 
        if (!bet) {
            return res.status(400).json({ message: 'No pending bet found' });
          }
        for (const bets of bet) {
            const game = await Game.findById(bets.game) 
            
            if (!game || game.result === '0:0') {
                    return res.status(400).json({
                        message: "Game not Fount or Game not updated" 
            })}
    
        }
        
        next()
        
    } catch (error) {
        return res.status(500).json({message: error.message})
    }

}

const validateGetResult = async (req,res,next)=>{
    try {
        const gameResult = await Game.find()
        if (!gameResult) 
        return res.status(400).json({
            message: "Game not Fount " 
        })
        next()
    
    } catch (error) {
        return res.status(500).json({message: error.message})
        
    }

}

const validateBank = async (req,res,next)=>{
    try {
        const country = req.params.country.toUpperCase(); 
        if (!country) 
            return res.status(400).json({
                message: "COuntry not found " 
            })
        next()
        
    } catch (error) {
        return res.status(500).json({message: error.message})
    }


}

const validateUserBetHistory = async(req,res,next)=>{
    try {
        const {userId} = req.params 
        const findUser = await User.findById(userId)
        
        
        if (!findUser) 
            return res.status(400).json({
                message: "No user" 
            })
        next()
        
    } catch (error) {
        return res.status(500).json({message: error.message})
    }

}

const validateForgotPassword = async (req,res,next) => {
    try {
        const user = await User.findOne({email})
    
        if (!user){
            return res.status(404).json({message: "User not Found"})
    
        }
        next()
    
        
    } catch (error) {
        return res.status(500).json({message: error.message})
        
    }

}


const validateResetPassword = async (req,res,next) => {
    try {
        const token = req.params.token
        const  {password} = req.body
        if (!password || !token){
            return res.status(404).json({message: "invalid Token"})
    
        }
        next()
        
    } catch (error) {
        return res.status(500).json({message: error.message})
        
        
    }
    
}

const validateUserRole = async (req,res,next) => {
    try {
        const {email, role} = req.body

        if(!email){
            res.status(400).json({
                message:"Please Input a valid Email Address "
            })
        }

        if(!role){
            res.status(400).json({
                message:"Please Input a valid Role "
            })
        }
        next()
    } catch (error) {
        return res.status(500).json({message: error.message})
        
    }
    
}

const validateWalletTop = async (req,res,next) => {
    try {
        const { amount, email,phoneNumber, } = req.body;
        if(!email){
            res.status(400).json({
                message:"Please Input a valid Email Address "
            })
        }
        if(!amount){
            res.status(400).json({
                message:"Please Input a valid amount "
            })
        }
        if(!phoneNumber){
            res.status(400).json({
                message:"Please Input a valid Phone Number "
            })
        }
        next()
    } catch (error) {
        return res.status(500).json({message: error.message})
    }

}

const validateWalletSuccess = async (req,res,next) => {
    try {
        const {status, tx_ref,transaction_id } = req.query
        if (!status||!transaction_id || !tx_ref) {
            return res.status(400).json({ message: 'Missing transaction Id' });
        }
        next()
    } catch (error) {
        return res.status(500).json({message: error.message})
        
    }
}

const validateWalletWithdraw = async (params) => {
    try {
        const { amount, account_bank, account_number } = req.body;
        
        if(!account_bank){
            res.status(400).json({
                message:"Please Input a valid account bank code"
            })
        }
        if(!amount){
            res.status(400).json({
                message:"Please Input a valid amount "
            })
        }
        if(!account_number){
            res.status(400).json({
                message:"Please Input a account number "
            })
        }

        next()
    } catch (error) {
        return res.status(500).json({message: error.message})
    }
    
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
validateBank,
validateUserBetHistory,
validateForgotPassword,
validateResetPassword,
validateUserRole,
validateWalletTop,
validateWalletSuccess,
validateWalletWithdraw

}