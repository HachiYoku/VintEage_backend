const express = require('express');
const router = express.Router();
const {
  createOrder,
  getItemsIBuy,
  getItemsISell,checkoutCart}= require('../controllers/orderController');
const validateToken = require('../middleware/authMiddleware');

// Create a new order
router.post('/', validateToken, createOrder);

// Checkout cart (selected items or all items)
router.post('/checkout', validateToken, checkoutCart);

// Get items I buy
router.get('/buy', validateToken, getItemsIBuy);

// Get items I sell
router.get('/sell', validateToken, getItemsISell);

module.exports = router;
