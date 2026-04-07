const userModel = require("../model/usermodel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendMail = require("../config/brevoMail");

// Ensure JWT_SECRET exists
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
}

// Helper function to generate JWT
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// 1. REGISTER USER
async function registerUser(req, res) {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "User already exists" });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await userModel.create({ name, email, password: hashedPassword });

        const token = generateToken(user._id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Send welcome email
        await sendMail(
            email,
            "Welcome to GreatStack",
            `Hello ${name}, your account has been successfully created!`
        );

        return res.status(201).json({ success: true, message: "User registered successfully" });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// 2. LOGIN USER
async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and Password are required" });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "Invalid email" });
        }

        if (!user.isAccountVerified) {
            return res.status(403).json({ success: false, message: "Please verify your email first" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }

        const token = generateToken(user._id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({ success: true, message: "Logged in successfully" });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// 3. LOGOUT USER
async function logout(req, res) {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
        });

        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// 4. SEND VERIFICATION OTP
async function sendVerificationOtp(req, res) {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId);

        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (user.isAccountVerified) return res.status(400).json({ success: false, message: "Account already verified" });

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const hashedOtp = await bcrypt.hash(otp, 10);

        user.verifyOtp = hashedOtp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        await sendMail(
            user.email,
            "Account Verification OTP",
            `Your OTP is ${otp}. Please verify your account.`
        );

        return res.status(200).json({ success: true, message: "Verification OTP sent to email" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// 5. VERIFY EMAIL
async function verifyEmail(req, res) {
    const { otp } = req.body;
    const userId = req.userId;

    if (!otp) return res.status(400).json({ success: false, message: "OTP is required" });

    try {
        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (!user.verifyOtp || !(await bcrypt.compare(otp, user.verifyOtp))) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP expired" });
        }

        user.isAccountVerified = true;
        user.verifyOtp = "";
        user.verifyOtpExpireAt = 0;

        await user.save();

        return res.status(200).json({ success: true, message: "Email verified successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// 6. SEND PASSWORD RESET OTP
async function sendResetOtp(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    try {
        const user = await userModel.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const hashedOtp = await bcrypt.hash(otp, 10);

        user.resetOtp = hashedOtp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

        await user.save();

        await sendMail(
            user.email,
            "Password Reset OTP",
            `Your OTP for resetting your password is ${otp}. It is valid for 15 minutes.`
        );

        return res.status(200).json({ success: true, message: "OTP sent to your email" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// 7. RESET PASSWORD
async function resetPassword(req, res) {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (!user.resetOtp || !(await bcrypt.compare(otp, user.resetOtp))) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP expired" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetOtp = "";
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.status(200).json({ success: true, message: "Password has been reset successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// 8. CHECK AUTH STATUS
async function isAuthenticated(req, res) {
    try {
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// ✅ Proper Export
module.exports = {
    registerUser,
    login,
    logout,
    sendVerificationOtp,
    verifyEmail,
    isAuthenticated,
    sendResetOtp,
    resetPassword
};