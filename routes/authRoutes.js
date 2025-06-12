const express = require("express")
const router = express.Router()
const { handleRegisterUser, handleLoginUser, handleGames, handlePostGames, handlePlaceBet, handleGameResults, handlePayouts, handleBetHistory, handleUserBetHistory, handleGetResults, handleHome, handleForgotPassword, handleResetPassword, handleRefreshToken, handleLogoutUser, updateUserRole } = require("../controllers")
const { validateRegister, authorization, validateLogin, adminAuthorization, validatePostGame, validatePlaceBet, validatePostResult, validateProcessPayment, validateGetResult } = require("../middlewares")



router.get("/",handleHome)

//api to register users 
router.post("/auth/register", validateRegister, handleRegisterUser)


//api for login 
router.post("/auth/login",validateLogin, handleLoginUser)

router.post("/forgot-password", handleForgotPassword)

router.patch("/reset-password/:token", handleResetPassword)

//Api for Admin to post games
router.post("/games",adminAuthorization, validatePostGame, handlePostGames)

//Api for users to view games
router.get("/games",authorization, handleGames)


router.post("/place-bet", authorization,validatePlaceBet,handlePlaceBet)

router.patch("/games-result/:id",adminAuthorization,validatePostResult ,handleGameResults)

router.post("/calculate-payouts",adminAuthorization,validateProcessPayment,handlePayouts)

router.get("/bets-history/:id",authorization,handleUserBetHistory)

router.get("/admin/bets-history",authorization,handleBetHistory)

router.get("/results",authorization,validateGetResult,handleGetResults)

router.post('/user/refresh_token', handleRefreshToken)

router.post("/logout",authorization, handleLogoutUser)

router.post("/update-user-role",adminAuthorization,updateUserRole)


module.exports = router