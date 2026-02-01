const express = require("express");
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const validateToken = require("../middleware/authMiddleware");

// Public route to get all products
router.get("/", getProducts);

// Public route to get single product
router.get("/:id", getProduct);

// Protected routes
router.post("/", validateToken, createProduct);
router.put("/:id", validateToken, updateProduct);
router.delete("/:id", validateToken, deleteProduct);

module.exports = router;
