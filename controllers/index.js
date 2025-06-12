const User = require("../models/userModel")
const Game = require("../models/gameModel")
const Bet = require("../models/betModel")
const bycrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const {sendForgotPasswordEmail} = require("../service/sendMail")


const handleHome = async (req,res) => {
    res.status(200).json({
        message:"HomePage Loaded Successfully"})
    
}

const handleRegisterUser = async (req,res)=>{
   
    try {
        const {email, password, firstname, lastname,age} = req.body
        // hash the password
        const hashedPassword =await bycrypt.hash(password, 12)

        const newUser = new User ({
            email, 
            password:hashedPassword, 
            firstname, 
            lastname,
            age
        })
        //store new user in the Database
        await newUser.save()

        res.status(201).json({
            message:"User Account created succesfully ",
            newUser
        })
    }
    catch (error){
        return res.status(500).json({message: error.message})

    }
    


}

const handleLoginUser = async (req, res )=>{

    try {
        const {email, password} = req.body

        const user = await User.findOne({email})

    
        const accessToken = jwt.sign(
            {id:user?._id},
            process.env.ACCESS_TOKEN,
            {expiresIn: "5m"}

        )
        const refreshToken = jwt.sign(
            {id:user?._id},
            process.env.REFRESH_TOKEN,
            {expiresIn: "5d"}

        )
        res.cookie('refreshtoken', refreshToken,{
            httpOnly: true,
            path: '/user/refresh_token',
            maxAge: 7*24*60*60*1000 //7 days

        })

        res.status(200).json({
            message:"User Login  succesfully ",
            accessToken,
            refreshToken,
            user
        })
        
    } catch (error) {
        return res.status(500).json({message: error.message})
        
    }

}

const handleRefreshToken = (req, res) => {
    const token = req.cookies.refreshtoken
    if (!token) return res.status(401).json({ message: 'No token found' })
    // verify token, issue new accessToken...
    

  }

const handleGames =  async (req, res)=>{
    const allGames = await Game.find()
    res.status(200).json({
        message:"success ",
        allGames
    })

}

const handleForgotPassword = async(req,res)=>{
    try {
        const {email} = req.body
        const user = await User.findOne({email})
    
        if (!user){
            return res.status(404).json({message: "User not Found"})
    
        }
    
        const accessToken = jwt.sign(
            { user },
            process.env.ACCESS_TOKEN,
            { expiresIn: "15m" }
        )
    
        await sendForgotPasswordEmail(email,accessToken)
    
        res.status(200).json({message: "Please check your email"})
        
    } catch (error) {
        return res.status(500).json({message: error.message})
        
    }


}

const handleResetPassword =  async(req,res)=>{
    try {
        const token = req.params.token
        const  {password} = req.body

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN)
        
        
        if(!decoded){
            return res.status(401).json({message: "Invalid Token"})
        }
        

        const user = await User.findById(decoded.user._id);
        if (!user) {
        return res.status(404).json({ message: "User not found" });
        }
        
        const hashedPassword =await bycrypt.hash(password, 12)

        await User.findOneAndUpdate({_id: decoded.user._id},{password: hashedPassword})
        
        await user.save()

        res.status(200).json({message: "Password successfully changed"})

        
    } catch (error) {
        return res.status(500).json({message: error.message})
        
    }
    
}

const handlePostGames = async (req, res)=>{
    try {
        
        const {league,hometeam,awayTeam,odds,gameDate,result} = req.body
        

        const findGame = await Game.findOne({hometeam,awayTeam,gameDate})

        if(findGame){
            return res.status(400).json({message:"Game already exist"})


         }


        const newGame = new Game ({league,hometeam,awayTeam,odds,gameDate,result})

        await newGame.save()

        res.status(201).json({
            message:"Game created successfully ",
            newGame
        })
        
    } catch (error) {
        return res.status(500).json({message: error.message})
    }

}

const handlePlaceBet = async (req, res)=>{
    try {
        const {gameId, stake, option} =req.body
        const user = req.user
        
        const game = await Game.findById(gameId)
        
        const payout = stake * game.odds[option]
    
        const bet = new Bet({
            user: user.id, 
            game: game.id,
            stake, 
            payout, 
            option})
    
        await bet.save()
        
        user.walletBalance = user.walletBalance - stake
    
        await user.save()
    
        res.status(201).json({
            message:"Bet Placed Successfully ",
            bet
        })
        
        
    } catch (error) {
        return res.status(500).json({message: error.message})
        
    }

}
const handleGameResults = async (req,res) => {
 try {
    const {gameId} = req.params
    const {result}= req.body
    const gameResult = await Game.findByIdAndUpdate(gameId, {result})

    res.status(201).json({
        message:"Bet Result Successfully Updated ",
        gameResult
    })
    
 } catch (error) {
    return res.status(500).json({message: error.message})
    
 }
    

} 

const handlePayouts = async (req,res) => {
    try {
        // Only get bets that haven't been settled yet
        const unsettledBets = await Bet.find({ outcome: 'pending' }) 
    
        const payoutOperations = unsettledBets.map(async (bet) => {
          const game = await Game.findById(bet.game) 
          if (!game || game.result === '0:0') 
            return res.status(200).json({
                message: "Game not Fount or Game not updated" 
            })
    
          const [homeScore, awayScore] = game.result.split(':').map(Number) 
    
          let actualResult = 'draw' 
          if (homeScore > awayScore) {
            actualResult = 'home'
        }
          else if (awayScore > homeScore) {
            actualResult = 'away'
        }
    
          let outcome = 'lost' 
          let payout = 0 
    
          if (bet.option === actualResult) {
            outcome = 'won' 
            const odds = game.odds[actualResult] 
            payout = bet.stake * odds 
    
            // Update user's wallet
            await User.findByIdAndUpdate(
              bet.user,
              { $inc: { walletBalance: payout } }
            ) 
          }
    
          // Save result on the bet
          bet.outcome = outcome 
          bet.payout = payout 
          await bet.save() 
        }) 
    
        await Promise.all(payoutOperations) 
    
        res.status(200).json({ message: "All Payments have been Processed and wallets updated." }) 
    
      } catch (err) {
        console.error(err) 
        res.status(500).json({ message: "Error processing payouts", error: err.message }) 
      }
    
}

const handleBetHistory = async (req,res)=>{
    const bets = await Bet.find()
    res.status(201).json({
        message:"Bet History Fetched successfully",
        bets
    })
}
const handleUserBetHistory = async (req,res)=>{
    const {userId} = req.params 
    
    const bets = await Bet.find(userId)
    // const game =
    res.status(201).json({
        message:"Bet History Fetched successfully",
        bets
    })
}

const handleGetResults = async (req,res) => {
    try {
       
       const gameResult = await Game.find()


       const results = gameResult.map(self => ({
        home: self.hometeam,
        away: self.awayTeam,
        result: self.result
      })) 
   
       res.status(201).json({
           message:"Bet Result Successfully Updated ",
           results: results
       })
       
    } catch (error) {
       return res.status(500).json({message: error.message})
       
    }
       
   
   }
   
const handleLogoutUser = async (req,res) => {
    try {
        res.clearCookie('refreshtoken', {path: '/user/refresh_token'})
        return res.status(200).json({message: "You have logged out successfully"})
        
    } catch (error) {
        return res.status(500).json({message: error.message})
        
    }
    
}

const updateUserRole = async (req,res) => {
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

        const updateRole = await User.findOneAndUpdate({email},{role})
        res.status(201).json({
            message:"User Role Successfully Updated ",
            updateRole
        })
    } catch (error) {
        return res.status(500).json({message: error.message})
        
    }
    
}



module.exports = {
    handleRegisterUser,
    handleLoginUser,
    handleGames,
    handlePostGames,
    handlePlaceBet,
    handleGameResults,
    handlePayouts,
    handleBetHistory,
    handleUserBetHistory,
    handleGetResults,
    handleHome,
    handleForgotPassword,
    handleResetPassword,
    handleRefreshToken,
    handleLogoutUser,
    updateUserRole
    
}
