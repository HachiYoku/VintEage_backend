const express = require('express')
const router = express.Router()
const { registerUser, loginUser,verifyEmail, viewProfile,deleteMyAccount } = require('../controllers/userController')
const validateToken = require('../middleware/authMiddleware')

// middleware that is specific to this router
router.use((req, res, next) => {
 console.log('Time: ', Date.now())
 next()
})

// Register new user
router.post('/register', registerUser)

// Email Verification
router.get('/verify-email', verifyEmail); 

// Login user
router.post('/login', loginUser)

//middleware to validate token
router.use(validateToken)

// User Profile
router.get("/profile", validateToken, viewProfile);

//delete my account
router.delete("/me", validateToken, deleteMyAccount);


module.exports = router
