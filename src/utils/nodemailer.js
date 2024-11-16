import nodemailer from "nodemailer";

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

/**
 * Send an email using the specified options
 * @param {string} to - Recipient email address
 * @param {string} subject - Subject of the email
 * @param {string} text - Plain text body of the email
 * @param {string} html - HTML body of the email
 */

// async..await is not allowed in global scope, must use a wrapper

export const sendEmail = async (to, subject, text, html) => {
  const mailOptions = {
    from: `"NetAlign" <${process.env.GMAIL_USER}>`, // sender address
    to, // receiver's email address
    subject, // subject line
    text, // plain text body
    html, // html body
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    // console.log(info)
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
