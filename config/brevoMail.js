const axios = require("axios");

const sendMail = async (to, subject, text) => {
  try {
    const res = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { email: process.env.SENDER_EMAIL },
        to: [{ email: to }],
        subject: subject,
        textContent: text,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("MAIL SENT:", res.data);
  } catch (err) {
    console.error("BREVO MAIL ERROR:", err.response?.data || err.message);
  }
};

module.exports = sendMail;