const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(200)
        .json({
          message:
            "If an account with that email exists, we’ve sent a password reset link.",
        });

    // Generate token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpire = Date.now() + 15 * 60 * 1000; // 15 min

    user.resetToken = resetToken;
    user.resetTokenExpire = resetTokenExpire;
    await user.save();

    // Send email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const html = `
      <h3>Password Reset Request</h3>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 15 minutes.</p>
    `;
    await sendEmail(user.email, "Password Reset", html);

    res.json({ message: "If the email exists, a reset link has been sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password)
      return res.status(400).json({ message: "New password is required" });

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Token invalid or expired" });

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpire = null;
    await user.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { forgotPassword, resetPassword };
