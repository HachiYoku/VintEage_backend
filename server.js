require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

const connectDB = require("./config/dbConnection");
connectDB();

const user = require("./routes/user");
app.use("/user", user);

const auth = require("./routes/auth");
app.use("/auth", auth);

// load product routes
const product = require("./routes/product");
app.use("/product", product);

// load order routes
const order = require("./routes/order");
app.use("/order", order);

const cartRoutes = require("./routes/cart");
app.use("/cart", cartRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
