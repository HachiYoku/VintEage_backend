const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyEmail,
  viewProfile,
  deleteMyAccount,
} = require("../controllers/userController");
const validateToken = require("../middleware/authMiddleware");

// ----------------- Public routes -----------------
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify-email", verifyEmail);

// ----------------- Protected routes -----------------
router.use(validateToken); // everything after this needs JWT
router.get("/profile", viewProfile);
router.delete("/me", deleteMyAccount);

module.exports = router;
