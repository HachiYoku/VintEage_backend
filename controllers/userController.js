const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const { uploadStream } = require("../utils/uploadStream");

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
    
    // Build verify link (frontend handles verification flow)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verifyLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

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

    //  return success
    return res.status(201).json({
      message: "Registration successful. Please verify your email.",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    // Check if token exists
    if (!token) {
      return res.status(400).json({ message: "Verification token is missing" });
    }

    console.log("Token received:", token);

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });
    console.log("User found:", user);

    if (!user) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    if (user.verificationTokenExpires < Date.now()) {
      return res.status(400).json({ message: "Verification token expired" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(200)
        .json({ message: "If that email exists, a verification link was sent" });
    }

    if (user.isVerified) {
      return res.status(200).json({ message: "Email is already verified" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verifyLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

    await sendEmail(
      user.email,
      "Verify your email",
      `
        <h3>Verify your email</h3>
        <p>Click the link below to verify your email:</p>
        <a href="${verifyLink}">Verify Email</a>
      `,
    );

    return res
      .status(200)
      .json({ message: "Verification email sent. Please check your inbox." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Account doesn't exist" });
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

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { username } = req.body;
    if (username) user.username = username;

    if (req.file && req.file.buffer) {
      const result = await uploadStream(req.file.buffer, "vintedge/avatars");
      user.avatar = result.secure_url;
      user.avatarPublicId = result.public_id;
    }

    await user.save();
    const updated = await User.findById(req.user.id).select("-password");
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification,
  viewProfile,
  deleteMyAccount,
  updateProfile,
};
