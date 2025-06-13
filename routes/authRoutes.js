const express = require("express")
const router = express.Router()
const { handleRegisterUser, handleLoginUser, handleGames, handlePostGames, handlePlaceBet, handleGameResults, handlePayouts, handleBetHistory, handleUserBetHistory, handleGetResults, handleHome, handleForgotPassword, handleResetPassword, handleRefreshToken, handleLogoutUser, updateUserRole, handleWalletTopup, handleWalletSuccess, handleWalletWithdraw, handleGetBanks } = require("../controllers")
const { validateRegister, authorization, validateLogin, adminAuthorization, validatePostGame, validatePlaceBet, validatePostResult, validateProcessPayment, validateGetResult, validateBank, validateUserBetHistory, validateForgotPassword, validateResetPassword, validateUserRole, validateWalletTop, validateWalletSuccess, validateWalletWithdraw } = require("../middlewares")



router.get("/",handleHome)

//api to register users 
router.post("/api/auth/register", validateRegister, handleRegisterUser)


//api for login 
router.post("/api/auth/login",validateLogin, handleLoginUser)

router.post("/api/forgot-password",validateForgotPassword, handleForgotPassword)

router.patch("/api/reset-password/:token",validateResetPassword, handleResetPassword)

//Api for Admin to post games
router.post("/api/games",adminAuthorization, validatePostGame, handlePostGames)

//Api for users to view games
router.get("/api/games",authorization, handleGames)

router.post("/api/place-bet", authorization,validatePlaceBet,handlePlaceBet)

router.patch("/api/games-result/:gameId",adminAuthorization,validatePostResult ,handleGameResults)

router.post("/api/calculate-payouts",adminAuthorization,validateProcessPayment,handlePayouts)

router.get("/api/bets-history/:userId",authorization,validateUserBetHistory,handleUserBetHistory)

router.get("/api/admin/bets-history",adminAuthorization,handleBetHistory)

router.get("/api/results",authorization,validateGetResult,handleGetResults)

router.post('/api/user/refresh_token', handleRefreshToken)

router.post("/api/logout",authorization, handleLogoutUser)

router.post("/api/update-user-role",adminAuthorization,validateUserRole,updateUserRole)

router.post('/api/wallet/topup',authorization,validateWalletTop, handleWalletTopup);

router.get('/api/wallet/success',authorization,validateWalletSuccess, handleWalletSuccess);

router.post('/api/wallet/withdraw', authorization,validateWalletWithdraw, handleWalletWithdraw);

router.get('/api/banks/:country',validateBank , handleGetBanks);

module.exports = router