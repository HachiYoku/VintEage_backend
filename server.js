require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const cors = require("cors");

const allowedOrigins = [
  "http://localhost:5173", // dev
  "https://vintedge-api.onrender.com", // production
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
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
  res.send("Backend API is running!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
