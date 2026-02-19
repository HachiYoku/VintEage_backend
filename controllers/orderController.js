const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
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
    if (product.user?.toString() === req.user.id) {
      return res.status(403).json({
        message: "You cannot buy your own product",
      });
    }

    const order = await Order.create({
      buyer: req.user.id,
      seller: product.user, // seller = product owner
      products: [
        {
          product: product._id,
          quantity,
          price: product.price,
          currency: product.currency || "MMK",
        },
      ],
      totalPrice: product.price * quantity,
    });

    const populatedOrder = await Order.findById(order._id).populate(
      "products.product",
      "title price currency",
    );

    return res.status(201).json(populatedOrder);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getItemsIBuy = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate("products.product", "title price image currency")
      .populate("seller", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getItemsISell = async (req, res) => {
  const orders = await Order.find({ seller: req.user.id })
    .populate("products.product", "title price image currency")
    .populate("buyer", "username email");

  res.json(orders);
};

// Checkout cart (selected items or all items)
const checkoutCart = async (req, res) => {
  try {
    const { selectedProductIds } = req.body;

    // 1. Get cart
    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 2. Decide what to checkout
    const itemsToCheckout = selectedProductIds?.length
      ? cart.items.filter(i =>
          selectedProductIds.includes(i.product._id.toString())
        )
      : cart.items;

    if (itemsToCheckout.length === 0) {
      return res.status(400).json({ message: "No matching items" });
    }
    const ownItems = itemsToCheckout.filter(
      (i) => i.product.user?.toString() === req.user.id
    );
    if (ownItems.length > 0) {
      return res.status(403).json({
        message: "You cannot buy your own product",
      });
    }

    // 3. Decrease stock (remember what we changed)
    const stockChanges = [];

    for (const item of itemsToCheckout) {
      const result = await Product.updateOne(
        { _id: item.product._id, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } }
      );

      if (result.modifiedCount === 0) {
        // rollback previous changes
        for (const sc of stockChanges) {
          await Product.updateOne(
            { _id: sc.productId },
            { $inc: { quantity: sc.qty } }
          );
        }
        return res.status(400).json({
          message: `Not enough stock for ${item.product.title}`,
        });
      }

      stockChanges.push({
        productId: item.product._id,
        qty: item.quantity,
      });
    }

    // 4. Group items by seller
    const ordersBySeller = {};

    for (const item of itemsToCheckout) {
      const sellerId = item.product.user.toString();

      if (!ordersBySeller[sellerId]) {
        ordersBySeller[sellerId] = [];
      }

      ordersBySeller[sellerId].push({
        product: item.product._id,
        title: item.product.title,
        image: item.product.image,
        quantity: item.quantity,
        price: item.product.price,
        currency: item.product.currency || "MMK",
      });
    }

    // 5. Create orders
    const createdOrders = [];

    for (const sellerId in ordersBySeller) {
      const products = ordersBySeller[sellerId];
      const totalPrice = products.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0
      );

      const order = await Order.create({
        buyer: req.user.id,
        seller: sellerId,
        products,
        totalPrice,
      });

      createdOrders.push(order);
    }

    // 6. Remove checked-out items from cart
    const checkoutIds = new Set(
      itemsToCheckout.map(i => i.product._id.toString())
    );

    cart.items = cart.items.filter(
      i => !checkoutIds.has(i.product._id.toString())
    );

    if (cart.items.length === 0) {
      await Cart.findByIdAndDelete(cart._id);
    } else {
      await cart.save();
    }

    // 7. Done 🎉
    res.status(201).json({
      message: "Checkout successful",
      orders: createdOrders,
      cart: cart.items.length ? cart : null,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getItemsIBuy,
  getItemsISell,
  checkoutCart,
};
