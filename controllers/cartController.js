const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

// Get cart for logged-in user
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
    );
    if (!cart) return res.json({ items: [] });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity)
      return res
        .status(400)
        .json({ message: "productId and quantity are required" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user: req.user.id });
    const existingQty = cart
      ? cart.items.find((i) => i.product.toString() === productId)?.quantity ||
        0
      : 0;
    const requestedTotal = existingQty + quantity;
    if (requestedTotal > product.quantity) {
      return res.status(400).json({
        message: `Insufficient stock. Only ${product.quantity - existingQty} more available.`,
      });
    }

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [{ product: productId, quantity }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId,
      );
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }
    }

    await cart.save();
    const populatedCart = await cart.populate("items.product");
    res.json(populatedCart);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Update quantity of a cart item
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { id } = req.params; // product ID
    if (quantity == null || quantity < 0)
      return res
        .status(400)
        .json({ message: "Quantity is required and must be >= 0" });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === id,
    );
    if (itemIndex === -1)
      return res.status(404).json({ message: "Product not in cart" });

    const product = await Product.findById(id);
    if (quantity > product.quantity) {
      return res
        .status(400)
        .json({
          message: `Insufficient stock. Only ${product.quantity} available.`,
        });
    }

    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
      if (cart.items.length === 0) {
        await Cart.findByIdAndDelete(cart._id);
        return res.json({ message: "Last item removed — cart deleted" });
      }
    } else {
      cart.items[itemIndex].quantity = quantity;
      await cart.save();
    }

    const populatedCart = await cart.populate("items.product");
    res.json(populatedCart);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Remove item from cart
const removeCartItem = async (req, res) => {
  try {
    const { id } = req.params; // product ID
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item.product.toString() !== id);

    if (cart.items.length === 0) {
      await Cart.findByIdAndDelete(cart._id);
      return res.json({ message: "All items removed — cart deleted" });
    }

    await cart.save();
    const populatedCart = await cart.populate("items.product");
    res.json(populatedCart);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// Clear all items in cart
const clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    await Cart.findByIdAndDelete(cart._id);
    res.json({ message: "Cart cleared and deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
