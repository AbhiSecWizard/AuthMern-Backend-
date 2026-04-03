require("dotenv/config")
const mongoose = require("mongoose")

async function connectDB() {
try {
    mongoose.connection.on("connected",()=>{
        console.log("DB is COnnected")
    })
    await mongoose.connect(process.env.MONGODB_URI)
} catch (error){
    console.log(error,"Error from ddb")
}
}

module.exports = connectDB


