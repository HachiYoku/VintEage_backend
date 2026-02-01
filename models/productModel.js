const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: "MMK" },
    quantity: { type: Number, default: 1 },
    condition: { type: String, default: "Brand New" },
    image: { type: String }, // store base64 or URL
    type: { type: String, default: "sell" },
    date: { type: Date, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // owner
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
