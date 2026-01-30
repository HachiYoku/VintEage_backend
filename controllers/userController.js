const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  //check if user exists
  const exitUser = await User.findOne({ email });
  if (exitUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  //create user
  const salt = bcrypt.genSaltSync(10);
  const hashPassword = bcrypt.hashSync(password, salt);
  const user = await User.create({ username, email, password: hashPassword });
  return res.status(201).json(user);

  res.json({ message: "register user" });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  const user = await User.findOne({ email });

  if (user && bcrypt.compareSync(password, user.password)) {
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "3m" },
    );
    return res.status(200).json({ accessToken });
  }

  return res
    .status(400)
    .json({ message: "Username or Password is incorrect!" });
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


module.exports = {registerUser,loginUser,viewProfile,deleteMyAccount
};
