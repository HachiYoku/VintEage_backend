const express = require("express");
const router = express.Router();

const {
  sendEmailTesting,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/email-test", sendEmailTesting);

module.exports = router;
