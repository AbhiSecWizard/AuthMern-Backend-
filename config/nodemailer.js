// const nodemailer = require("nodemailer")

// const transporter = nodemailer.createTransport({
//       host:'smtp-relay.brevo.com',
//       port:587,
//       auth:{
//         user:process.env.SMTP_USER,
//         pass:process.env.SMTP_PASS
//       }
// })

// module.exports = transporter








const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // required for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;