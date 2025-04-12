const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Try to connect to MongoDB but don't crash if it fails
try {
  connectDB();
  console.log("MongoDB connection attempted");
} catch (error) {
  console.log("MongoDB connection failed, but server will continue running");
  console.error(error);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/images", require("./routes/imageRoutes"));
app.use("/api/proxy", require("./routes/imageProxyRoutes"));

// Basic route
app.get("/", (req, res) => {
  res.send("AI Image Generator API is running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
