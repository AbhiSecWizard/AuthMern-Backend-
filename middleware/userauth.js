const jwt = require("jsonwebtoken");

const userAuth = async (req, res, next) => {
    // 1. Cookies से टोकन निकालें
    const { token } = req.cookies;

    // अगर टोकन नहीं है, तो एरर भेजें (यही मैसेज आपको फ्रंटएंड पर दिख रहा है)
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not Authorized Login Again' 
        });
    }

    try {
        // 2. टोकन को Verify करें
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        // 3. चेक करें कि decode हुई body में 'id' मौजूद है या नहीं
        if (tokenDecode && tokenDecode.id) {
            req.userId = tokenDecode.id; // ✅ यह ID कंट्रोलर में इस्तेमाल होगी
            next(); // ✅ अगले फंक्शन (Controller) पर जाने दें
        } else {
            return res.status(401).json({
                success: false,
                message: "Not Authorized Login Again"
            });
        }

    } catch (error) {
        // अगर टोकन एक्सपायर हो गया है या गलत है
        return res.status(401).json({
            success: false,
            message: "Session Expired, Login Again"
        });
    }
};

module.exports = userAuth;