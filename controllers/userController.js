const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create user
    await User.create({
      username,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpires: Date.now() + 1000 * 60 * 60, // 1 hour
      isVerified: false,
    });

    // Build verify link
    const verifyLink = `${process.env.FRONTEND_URL || "https://vintedge-api.onrender.com"}/user/verify-email?token=${verificationToken}`;

    try {
      await sendEmail(
        email,
        "Verify your email",
        `
          <h3>Welcome!</h3>
          <p>Click the link below to verify your email:</p>
          <a href="${verifyLink}">Verify Email</a>
        `,
      );
    } catch (emailError) {
      console.warn("Email failed but user registered:", emailError.message);
    }

    // 4️⃣ Always return success
    return res.status(201).json({
      message: "Registration successful. Please verify your email.",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  if (!user.isVerified) {
    return res.status(401).json({
      message: "Please verify your email before logging in",
    });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({ accessToken: token });
};

const verifyEmail = async (req, res) => {
  const { token } = req.query;

  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    return res.status(400).json({ message: "Invalid verification token" });
  }

  if (user.verificationTokenExpires < Date.now()) {
    return res.status(400).json({ message: "Verification token expired" });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  return res.status(200).json({ message: "Email verified successfully" });
};

const viewProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json(user);
};

const deleteMyAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: "Password is required to delete account",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = bcrypt.compareSync(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Password is incorrect" });
    }

    await User.findByIdAndDelete(req.user.id);

    return res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  viewProfile,
  deleteMyAccount,
};
