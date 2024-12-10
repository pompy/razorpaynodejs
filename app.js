require('dotenv').config();
const express = require("express");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const cors = require('cors');


const app = express();
var razorkey='rzp_test_dX0xhbPKerJn5W';
var razorsecret='RCErvnytQ3dgj9YSj8YsBC5Q';

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.set('view engine', 'ejs');


// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// API endpoint to create an order
app.post("/create-order", async (req, res) => {
  const { amount, currency } = req.body;
  const customOrderId = generateCustomOrderId();
  try {
    const options = {
      amount: amount * 100, // Convert to smallest unit (paisa)
      currency: currency || "INR",
      receipt: customOrderId,
    notes: {
      tracking_id: customOrderId, // Custom tracking ID
    },
    };

    const order = await razorpay.orders.create(options);
    res.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
	  tracking_id: customOrderId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating order");
  }
});

// API endpoint to verify the payment signature
app.post("/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    res.send("Payment verified successfully!" );
  } else {
    res.status(400).send("Invalid signature");
  }
});

// Serve frontend
app.get("/", (req, res) => {
  res.render('index', { key: process.env.RAZORPAY_KEY_ID });
  //res.sendFile(__dirname + "/index.html");
});


// Generate a custom order ID
function generateCustomOrderId() {
  return `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
