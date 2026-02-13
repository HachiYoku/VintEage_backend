require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  "https://vint-edge.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

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
