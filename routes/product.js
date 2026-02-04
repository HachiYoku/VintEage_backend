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
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Public route to get all products
router.get("/", getProducts);

// Public route to get single product
router.get("/:id", getProduct);

// Protected routes
router.post("/", validateToken, upload.single('image'), createProduct);
router.put("/:id", validateToken, upload.single('image'), updateProduct);
router.delete("/:id", validateToken, deleteProduct);

module.exports = router;
