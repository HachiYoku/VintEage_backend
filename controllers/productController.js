const Product = require("../models/productModel");

// Create Product
const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      price,
      currency,
      quantity,
      condition,
      image,
    } = req.body;

    const product = await Product.create({
      title,
      description,
      category,
      price,
      currency,
      quantity,
      condition,
      image,
      user: req.user.id, // from JWT middleware
    });

    return res.status(201).json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Get all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.status(200).json(products);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Get single product
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    return res.status(200).json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Update Product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.user.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: "Not authorized to update this product" });

    Object.assign(product, req.body);
    await product.save();

    return res.status(200).json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.user.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: "Not authorized to delete this product" });

    await product.deleteOne();

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};
