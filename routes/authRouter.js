const express = require("express")
const authControllers = require("../controllers/authControllers")
const authRouter = express.Router()
const userAuth = require("../middleware/userauth")

authRouter.post('/register',authControllers.registerUser)
authRouter.post('/login',authControllers.login)
authRouter.post('/logout',authControllers.logout)
authRouter.post('/send-verify-otp',userAuth,authControllers.sendVerificationOtp)
authRouter.post('/verify-account',userAuth,authControllers.verifyEmail)
authRouter.get('/is-auth',userAuth,authControllers.isAuthenticated)
authRouter.post('/reset-password',authControllers.resetPassword)
authRouter.post('/send-reset-otp',authControllers.sendResetOtp)

module.exports = authRouter
