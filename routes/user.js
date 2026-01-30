const express = require('express')
const router = express.Router()
const { registerUser, loginUser, viewProfile,deleteMyAccount } = require('../controllers/userController')
const validateToken = require('../middleware/authMiddleware')

// middleware that is specific to this router
router.use((req, res, next) => {
 console.log('Time: ', Date.now())
 next()
})

// Register new user
router.post('/register', registerUser)

// Login user
router.post('/login', loginUser)

//middleware to validate token
router.use(validateToken)

// User Profile
router.get("/profile", validateToken, viewProfile);

//delete my account
router.delete("/me", validateToken, deleteMyAccount);


module.exports = router
