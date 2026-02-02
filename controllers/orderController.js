const Order = require("../models/orderModel");
const Product = require("../models/productModel");

// Create a new order
const createOrder = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        message: "productId and quantity are required",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const order = await Order.create({
      buyer: req.user.id,
      seller: product.user, // seller = product owner
      products: [
        {
          product: product._id,
          quantity,
          price: product.price,
        },
      ],
      totalPrice: product.price * quantity,
    });

    const populatedOrder = await Order.findById(order._id).populate(
      "products.product",
      "title price",
    );

    return res.status(201).json(populatedOrder);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getItemsIBuy = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate("products.product", "title price image")
      .populate("seller", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getItemsISell = async (req, res) => {
  const orders = await Order.find({ seller: req.user.id })
    .populate("products.product", "title price image")
    .populate("buyer", "username email");

  res.json(orders);
};

module.exports = {
  createOrder,
  getItemsIBuy,
  getItemsISell,
};
