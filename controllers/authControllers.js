const userModel = require("../model/usermodel");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");
const  transporter  = require("../config/nodemailer");

async function registerUser(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  try {
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword
    });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // send welcome email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to GreatStack",
      text: `Hello ${name}, your account has been successfully created with email ${email}`
    };

    await transporter.sendMail(mailOptions);
    return res.status(201).json({
      success: true,
      message: "User registered successfully"
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
}

async function login(req,res) {
    const {email,password} = req.body

    if(!email || !password){
        return res.json({success:false,
            massage:"'Email and Password are required"
        })
    }

    try{
       const user = await userModel.findOne({email}) 
       if(!user){
        return res.json({
           success:false,
           message:"Invalid email",
        })
       }
       const isMatch = await bcrypt.compare(password,user.password)
       if(!isMatch){
        return res.json({success:false, message:"Invalid password"})
       }
       
       const token = jwt.sign({
            id:user._id
        },process.env.JWT_SECRET, {expiresIn:"7d"})
        res.cookie("token",token, {
            httpOnly:true,
            secure:process.env.NODE_ENV === 'production',
            sameSite:process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge:7 * 24 * 60 * 60 *1000
        })
        return res.json({success:true, })
    }
    catch(error){
        return res.json({
            success:false,
            message:error.message
        })
    }

}

async function logout(req,res){
    try{

        if(!req.cookies.token){
            return res.status(400).json({
                success:false,
                message:"Already logged out"
            })
        }

        res.clearCookie("token",{
            httpOnly:true,
            secure:process.env.NODE_ENV === 'production',
            sameSite:process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        })

        return res.status(200).json({
            success:true,
            message:"Logged Out Successfully"
        })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

async function sendVerificationOtp (req,res){
try {

const userId = req.userId   // ✅ Correct

const user = await userModel.findById(userId)

if(user.isAccountVerified){
  return res.json({
    success:false,
    message:"Account Already Verified"
  })
}

const otp = String(Math.floor(100000 + Math.random() * 900000))

user.verifyOtp = otp
user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000 

await user.save()

const mailOptions = {
  from: process.env.SENDER_EMAIL,
  to: user.email,
  subject: "Account Verification OTP",
  text: `Your OTP Is ${otp}. Verify your account using this OTP`
}

await transporter.sendMail(mailOptions)

res.json({
  success:true,
  message:"Verification OTP Sent on Your Email"
})

} catch (error) {
  return res.json({
    success:false,
    message:error.message
  })
}
}
//   verifyEmail-----------------------------------------------------------------
//   verifyEmail-----------------------------------------------------------------
async function verifyEmail (req,res){

   const {otp} = req.body
   const userId = req.userId

   if(!otp){
    return res.json({
      success:false,
      message:"OTP Required"
    })
   }

   try {

    const user = await userModel.findById(userId)

    if(!user){
      return res.json({
        success:false,
        message:"User not found"
      })
    }

    if(!user.verifyOtp || user.verifyOtp !== otp){
      return res.json({
        success:false,
        message:"Invalid OTP"
      })
    }

    if(user.verifyOtpExpireAt < Date.now()){
      return res.json({
        success:false,
        message:"OTP Expired"
      })
    }

    user.isAccountVerified = true
    user.verifyOtp = ""
    user.verifyOtpExpireAt = 0

    await user.save()

    return res.json({
      success:true,
      message:"Email Verified Successfully"
    })

   } catch (error) {

    return res.json({
      success:false,
      message:error.message
    })

   }
}

async function isAuthenticated(req,res){
try {
   return res.json({success:true})
  } catch (error) {
    res.json({
      success:false, message:error.message
    })
  }
}

async function sendResetOtp(req,res){
  const {email} = req.body
  if(!email){
    return res.json({
      seccess:false,
      message:"Email is Required"
    })
  }
  try {
    const user = await userModel.findOne({email})
    if(!user){
      return res.json({
        success:false,
        message:"User Not Found",
      })}
     const otp = String(Math.floor(100000 + Math.random() * 900000))
     user.resetOtp = otp
     user.resetOtpExpireAt = Date.now() + 14 * 60 * 1000 
     
     await user.save()
     const mailOptions = {
     from: process.env.SENDER_EMAIL,
     to: user.email,
     subject: "Password Reset OTP",
     text: `Your OTP for resetting your Password is ${otp} Use this OTP to proceed with resetting your password`
     }
    await transporter.sendMail(mailOptions)
    res.json({
      success:true,
      message:`OTP Send Your Email`
    })
  } catch (error) {
    
  }
}

async function resetPassword(req,res) {
  const {email,otp,newPassword} = req.body
  if(!email || !otp || !newPassword ){
    return res.json({
      success:false,
      message:"Email, OTP , and new password are required"
    })
  } 
  try {
    const user = await userModel.findOne({email})
    if(!user){
      return res.json({
        success:false,
        message:'User not found'
      })
    }
    if(!user.resetOtp === "" || user.resetOtp !== otp){
      return res.json({
        success:false,
        message:"Invalid OTP"
      })
    }
    if(user.resetOtpExpireAt < Date.now()){
      return res.json({
        success:false,
        message:'OPT Expired'
      })
    }
       const hashedPassword = await bcrypt.hash(newPassword,10)
       user.password = hashedPassword
       user.resetOtp = ''
       user.resetOtpExpireAt = 0
      await user.save()
      return res.json({
        success:true,
        message:'Password has been reset successfully'
      })
  } catch (error) {
    return res.json({
      success:false,
      message:error.message
    })
  }
}
module.exports = {resetPassword,sendResetOtp,registerUser,isAuthenticated,login,logout,verifyEmail,sendVerificationOtp}
