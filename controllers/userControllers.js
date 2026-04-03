const userModel = require("../model/usermodel.js")

async function getUserData(req,res) {
  try {
    const userId = req.userId  // ✅ middleware se

    const user = await userModel.findById(userId)

    if(!user){
      return res.json({
        success:false,
        message:"User not found"
      })
    }
    res.json({
      success:true,
      userData:{
        name: user.name,
        isAccountVerified:user.isAccountVerified
      }
    })

  } catch (error) {
    res.json({
      success:false,
      message:error.message
    })
  }
}

module.exports = {getUserData}