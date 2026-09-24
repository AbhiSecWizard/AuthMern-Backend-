// require("dotenv/config")        
// const express = require("express")           
// const cors = require("cors")           
// const authRouter = require("./routes/authRouter")
// const cookieParser = require("cookie-parser")
// const connectDB = require("./config/mongodb")
// const userRouter = require("./routes/userRouter")
// const sendMail = require("./config/brevoMail")

// // const path = require("path")

// const app = express()

// const port = process.env.PORT || 5000
// app.use(express.json())
// app.use(cookieParser())
// const allowedOrigins = [
//   "http://localhost:5173",
//   "https://auth-mern-frontend-wnmb.vercel.app"
// ];

// app.use((req, res, next) => {
//   console.log("Incoming:", req.method, req.url);
//   next();
// });
// app.set('trust proxy', 1);
// app.use(cors({
//   origin: allowedOrigins,
//   credentials: true,
// }));
//               connectDB()
// // API end Points       
// app.use("/api/auth",authRouter)
// app.use("/api/user",userRouter)


// app.get("/mail-test", async (req, res) => {
//   try {
//     await sendMail(
//       "studyandrotech@gmail.com",
//       "Test",
//       "Brevo API working"
//     );
//     res.send("Mail sent");
//   } catch (e) {
//     res.send(e.message);
//   }
// });

// app.get("/",(req,res)=>{
//     res.send("API WORKING")
// })
// app.listen(port,()=>{
//     console.log(`server is running on PORT : ${port}`)
// })
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/mongodb");
const authRouter = require("./routes/authRouter");
const userRouter = require("./routes/userRouter");
const sendMail = require("./config/brevoMail");

const app = express();

const PORT = process.env.PORT || 5000;

// ========================
// Middleware
// ========================

app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
    "http://localhost:5173",
    "https://auth-mern-frontend-wnmb.vercel.app",
];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

app.set("trust proxy", 1);

// ========================
// Routes
// ========================

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// ========================
// Test Routes
// ========================

app.get("/", (req, res) => {
    res.status(200).send("API WORKING");
});

app.get("/mail-test", async (req, res) => {
    try {
        await sendMail(
            "studyandrotech@gmail.com",
            "Test",
            "Brevo API working"
        );

        res.status(200).send("Mail sent");
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// ========================
// Start Server
// ========================

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on PORT: ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();