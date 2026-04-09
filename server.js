require("dotenv/config")        
const express = require("express")           
const cors = require("cors")           
const authRouter = require("./routes/authRouter")
const cookieParser = require("cookie-parser")
const connectDB = require("./config/mongodb")
const userRouter = require("./routes/userRouter")
const sendMail = require("./config/brevoMail")

// const path = require("path")

const app = express()

const port = process.env.PORT || 5000
app.use(express.json())
app.use(cookieParser())
const allowedOrigins = [
  "http://localhost:5173"
];

app.use((req, res, next) => {
  console.log("Incoming:", req.method, req.url);
  next();
});
app.set('trust proxy', 1);
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
              connectDB()
// API end Points       
app.use("/api/auth",authRouter)
app.use("/api/user",userRouter)


app.get("/mail-test", async (req, res) => {
  try {
    await sendMail(
      "studyandrotech@gmail.com",
      "Test",
      "Brevo API working"
    );
    res.send("Mail sent");
  } catch (e) {
    res.send(e.message);
  }
});

app.get("/",(req,res)=>{
    res.send("API WORKING")
})
app.listen(port,()=>{
    console.log(`server is running on PORT : ${port}`)
})