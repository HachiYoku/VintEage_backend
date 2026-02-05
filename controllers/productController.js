const Product = require("../models/productModel");
const { uploadStream } = require("../utils/uploadStream");

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
    } = req.body;

    let imageUrl = req.body.image;
    let imagePublicId = undefined;

    // if a file was uploaded (multer memoryStorage), upload to Cloudinary
    if (req.file && req.file.buffer) {
      const result = await uploadStream(req.file.buffer);
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    const product = await Product.create({
      title,
      description,
      category,
      price,
      currency,
      quantity,
      condition,
      image: imageUrl,
      imagePublicId,
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

    // handle image replacement
    let updatedData = { ...req.body };

    if (req.file && req.file.buffer) {
      // upload new image
      const result = await uploadStream(req.file.buffer);

      // delete old image from Cloudinary if exists
      if (product.imagePublicId) {
        try {
          const cloudinary = require('../config/cloudinary');
          await cloudinary.uploader.destroy(product.imagePublicId);
        } catch (e) {
          // log and continue; don't fail update due to delete error
          console.error('Cloudinary delete failed:', e.message);
        }
      }

      product.image = result.secure_url;
      product.imagePublicId = result.public_id;
      // ensure image fields in updatedData reflect new upload
      updatedData.image = result.secure_url;
      updatedData.imagePublicId = result.public_id;
    } else {
      // If no new file uploaded, avoid overwriting existing image fields
      if ('image' in updatedData) delete updatedData.image;
      if ('imagePublicId' in updatedData) delete updatedData.imagePublicId;
    }

    Object.assign(product, updatedData);
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
