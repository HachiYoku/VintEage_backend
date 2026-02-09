const crypto = require("crypto");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");

const sendEmailTesting = async (req, res) => {
  try {
    const { email } = req.body;

    await sendEmail(email, "Email Testing", "Welcome to our blog system!");

    res.status(200).json({
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to send email",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      // Avoid account enumeration; still respond OK
      return res.json({ message: "Password reset link sent to your email" });
    }
    // Generate token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpire = Date.now() + 15 * 60 * 1000; // 15 mins
    // Save to DB
    user.resetToken = resetToken;
    user.resetTokenExpire = resetTokenExpire;
    await user.save();

    // Send email
    const resetLink = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/reset-password/${resetToken}`;
    const html = `
      <h3>Password Reset Request</h3>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link will expire in 15 minutes.</p>
    `;

    await sendEmail(user.email, "Password Reset", html);

    res.json({ message: "Password reset link sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Email sending failed", error });
  }
};

const bcrypt = require("bcryptjs");
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    // Validate that newPassword is provided
    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Token is invalid or has expired" });
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hashSync(
      password,
      bcrypt.genSaltSync(20),
    );

    // Update user with new password and clear reset token fields
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpire = null;
    await user.save();
    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { sendEmailTesting, forgotPassword, resetPassword };
