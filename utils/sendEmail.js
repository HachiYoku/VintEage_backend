const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter (optional but helpful for debugging)
    await transporter.verify();

    // Send email
    const info = await transporter.sendMail({
      from: `"My App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("SendEmail Error:", error.message);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
