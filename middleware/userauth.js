const jwt = require("jsonwebtoken");

const userAuth = async (req, res, next) => {
    const { token } = req.cookies; // Cookie-parser ki wajah se ye chalega

    if (!token) {
        return res.json({ success: false, message: "Not Authorized Login Again" });
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
        if (tokenDecode.id) {
            req.userId = tokenDecode.id;
        } else {
            return res.json({ success: false, message: "Not Authorized Login Again" });
        }
        next();
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

module.exports = userAuth;