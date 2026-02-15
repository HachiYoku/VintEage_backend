const express = require('express')
const router = express.Router()
const {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification,
  viewProfile,
  deleteMyAccount,
  updateProfile,
} = require("../controllers/userController");
const validateToken = require('../middleware/authMiddleware')
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// middleware that is specific to this router
router.use((req, res, next) => {
 console.log('Time: ', Date.now())
 next()
})

// Register new user
router.post('/register', registerUser)

// Email Verification
router.get('/verify-email', verifyEmail); 
router.post('/resend-verification', resendVerification);

// Login user
router.post('/login', loginUser)

//middleware to validate token
router.use(validateToken)

// User Profile
router.get("/profile", validateToken, viewProfile);
router.put("/profile", validateToken, upload.single("avatar"), updateProfile);

//delete my account
router.delete("/me", validateToken, deleteMyAccount);


module.exports = router
