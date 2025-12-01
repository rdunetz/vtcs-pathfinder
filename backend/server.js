// require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { db } = require("./db"); // Import db from db/index.js

// Import routes
const coursesRouter = require("./routes/courses");
const plansRouter = require("./routes/plan");
const usersRouter = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "VTCS Pathfinder API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/courses", coursesRouter);
app.use("/api/plans", plansRouter);
app.use("/api/users", usersRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Endpoints:`);
  console.log(`   - Courses: http://localhost:${PORT}/api/courses`);
  console.log(`   - Plans: http://localhost:${PORT}/api/plans`);
  console.log(`   - Users: http://localhost:${PORT}/api/users`);
});
