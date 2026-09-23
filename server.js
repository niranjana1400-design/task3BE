require("dotenv").config();

const express = require("express");
const cors = require("cors");

const analyzeRoutes = require("./routes/analyze");
const exportRoutes = require("./routes/export");

const app = express();

// ===============================
// CORS
// ===============================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// ===============================
// BODY PARSER
// ===============================

app.use(
  express.json({
    limit: "10mb",
  })
);

// ===============================
// ROOT
// ===============================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Image Content Document API is running",
  });
});

// ===============================
// API ROUTES
// ===============================

app.use("/api/analyze", analyzeRoutes);

app.use("/api/export", exportRoutes);


// ERROR HANDLER


app.use((error, req, res, next) => {
  console.error("Server Error:", error);

  res.status(500).json({
    success: false,
    message: error.message || "Server error",
  });
});


// SERVER


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(
    `Vision provider: ${process.env.VISION_PROVIDER || "mock"}`
  );
});