const express = require("express")
const userAuth = require("../middleware/userauth.js")
const { getUserData } = require("../controllers/userControllers")

const userRouter = express.Router()

userRouter.get("/data",userAuth,getUserData)

module.exports = userRouter