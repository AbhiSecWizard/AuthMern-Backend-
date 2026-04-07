const userModel = require("../model/usermodel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendMail = require("../config/brevoMail");

// --- HELPER: Generate Cookie Options ---
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
};

// 1. REGISTER USER
const registerUser = async (req, res) => {
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
        const user = await userModel.create({
            name,
            email,
            password: hashedPassword
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token, cookieOptions);

        // Brevo Email Integration
        await sendMail(
            email,
            "Welcome to GreatStack",
            `Hello ${name}, your account has been successfully created!`
        );

        return res.status(201).json({ success: true, message: "User registered successfully" });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. LOGIN USER
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and Password are required" });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "Invalid email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token, cookieOptions);

        return res.status(200).json({ success: true, message: "Logged in successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 3. LOGOUT USER
const logout = async (req, res) => {
    try {
        res.clearCookie("token", cookieOptions);
        return res.status(200).json({ success: true, message: "Logged Out Successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 4. SEND VERIFICATION OTP
const sendVerificationOtp = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId);

        if (user.isAccountVerified) {
            return res.status(400).json({ success: false, message: "Account Already Verified" });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 Hours

        await user.save();

        await sendMail(
            user.email,
            "Account Verification OTP",
            `Your OTP is ${otp}. Please verify your account.`
        );

        return res.status(200).json({ success: true, message: "Verification OTP Sent to Email" });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 5. VERIFY EMAIL
const verifyEmail = async (req, res) => {
    const { otp } = req.body;
    const userId = req.userId;

    if (!otp) {
        return res.status(400).json({ success: false, message: "OTP Required" });
    }

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!user.verifyOtp || user.verifyOtp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP Expired" });
        }

        user.isAccountVerified = true;
        user.verifyOtp = "";
        user.verifyOtpExpireAt = 0;

        await user.save();

        return res.status(200).json({ success: true, message: "Email Verified Successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 6. SEND PASSWORD RESET OTP
const sendResetOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User Not Found" });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000; // 15 Minutes

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
};

// 7. RESET PASSWORD
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!user.resetOtp || user.resetOtp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP Expired" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.status(200).json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 8. CHECK AUTH STATUS
const isAuthenticated = async (req, res) => {
    try {
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Exporting all functions
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