const User = require("../models/userModel")
const Game = require("../models/gameModel")
const Bet = require("../models/betModel")
const bycrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const {sendForgotPasswordEmail} = require("../service/sendMail")
const {flw} = require("../service/paymentService")
const axios = require('axios');
const Payment = require("../models/paymentModel")


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
    
    

  }

const handleGames =  async (req, res)=>{
    try {
        const allGames = await Game.find()
    res.status(200).json({
        message:"success ",
        allGames
    })
        
    } catch (error) {
        return res.status(500).json({message: error.message})
        
    }
    

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
    try {
        const bets = await Bet.find()
        res.status(201).json({
            message:"Bet History Fetched successfully",
            bets
    })
        
    } catch (error) {
        return res.status(500).json({message: error.message})
        
    }
    
}
const handleUserBetHistory = async (req,res)=>{
    try {
        const {userId} = req.params 
    
        const bets = await Bet.find(userId)
        // const game =
        res.status(201).json({
            message:"Bet History Fetched successfully",
            bets
        })
        
    } catch (error) {
        return res.status(500).json({message: error.message})
        
    }
    
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

const handleWalletTopup = async (req, res) => {
    
    try {
        const { amount, email,phoneNumber, } = req.body;
        const tx_ref = `wallet_${req.user.id}_${Date.now()}`
      const paymentResponse = await axios.post(
        'https://api.flutterwave.com/v3/payments',
        {
        tx_ref,
        amount,
        currency: 'NGN',
        redirect_url: `${process.env.CLIENT_URL}/api/wallet/success`,
        customer: { 
            email,
            phonenumber: phoneNumber,
             name: `${req.user.firstname} ${req.user.lastname}` 
            },
        customizations: {

            title : "Betting Platform CareerEX",
            description:"Payment for Wallet"
        }
      },
      {
        headers: {
            Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
        }

      }
    );
      // Save a "Deposit" record with tx_ref and pending status (optional)
       res.status(200).json(paymentResponse.data);
      
    } 
    catch (error) {
    
      res.status(500).json({ message: error.message });
    }
  }

const handleWalletSuccess = async (req, res) => {
    try {
        
        const {status, tx_ref,transaction_id } = req.query
        if (!status||!transaction_id || !tx_ref) {
            return res.status(400).json({ message: 'Missing transaction Id' });
        }

        const existing = await Payment.findOne({ transactionId: transaction_id });
        if (existing) {
            return res.status(200).json({ message: 'Transaction already processed' });
        }
    

        const verificationResponse = await axios.get(
            `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
                }
            }

        )

        const transactionData = verificationResponse.data.data
        if (transactionData.status !== "successful"){
            res.status(400).json({
                status: "failed",
                message: "Transaction verified failed"
            })
        }

        const payment = await Payment.create({
            user: req.user.id,
            transactionId: transaction_id,
            tx_ref,
            amount: transactionData.amount,
            currency: transactionData.currency,
            status: transactionData.status,
        });

        await User.findByIdAndUpdate(req.user.id, { $inc: { walletBalance: transactionData.amount } });

        return res.status(200).json({
        status: 'success',
        message: 'Wallet topped up successfully',
        newBalance: (await User.findById(req.user.id)).walletBalance
        });
    
        
    }
    catch (error) {
      console.error(error);
      res.status(400).json({ message: error.message });
    }
  }

const handleWalletWithdraw =async (req, res) => {
    const { amount, account_bank, account_number } = req.body;
    const userId = req.user.id;
  
    if (amount > req.user.walletBalance) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }
  
    try {
      const payload = {
        account_bank,
        account_number,
        amount,
        currency: 'NGN',
        narration: `Withdrawal for user ${userId}`,
        reference: `withdraw_${userId}_${Date.now()}`,
      
      };
        const accRes = await flw.Misc.verify_Account({account_number,account_bank});
        if (!accRes.status === 'success') {
            return res.status(400).json({ message: 'Account verification failed' });
        }

        
        
        
  
      const response = await flw.Transfer.initiate(payload);
      if (response.status === 'success') {
        await User.findByIdAndUpdate(userId, {
          $inc: { walletBalance: -amount }
        });
        return res.json({ message: 'Withdrawal initiated', data: response.data });
      }
  
      res.status(400).json({ status: response.status ,message: response.message, data: response.data });
      
      
    } catch (error) {
      console.error('Withdrawal error:', error);
      res.status(500).json({ message: error.message });
    }
  }

const handleGetBanks = async (req, res) => {
    try {
      const country = req.params.country.toUpperCase(); // e.g. "NG"
      const response = await flw.Bank.country({ country });
      // Response contains a `data` array with bank info
      res.json({ banks: response.data });
    } catch (error) {
      console.error('Error fetching banks:', error);
      res.status(500).json({ message: 'Failed to fetch banks', error: error.message });
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
    updateUserRole,
    handleWalletTopup,
    handleWalletSuccess,
    handleWalletWithdraw,
    handleGetBanks
    
}
