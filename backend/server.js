const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const labRoutes = require('./routes/labRoutes');
const vendorRoutes = require("./routes/vendorRoutes");
const quotationSystemRoutes = require("./routes/QuotationSystemRoutes");
const consultantRoutes = require('./routes/consultantRoutes');
const universityRoutes = require('./routes/universityRoutes');
const projectAssignmentRoutes = require('./routes/projectAssignmentRoutes');
const projectProgressRoutes = require('./routes/projectProgressRoutes');
// MODULE 2 - Task 2A: Hire Request Routes
const hireRoutes = require('./routes/hireRoutes');
// MODULE 2 - Task 2C: Infrastructure Service Routes
const infrastructureServiceRoutes = require('./routes/infrastructureServiceRoutes');
// MODULE 2 - Task 2D: Lab Optimization Routes
const labOptimizationRoutes = require('./routes/labOptimizationRoutes');
// Document Submission Routes (Finance/Procurement Approval Workflow)
const documentSubmissionRoutes = require('./routes/documentSubmissionRoutes');
// Notification Routes (Module 3 - Feature 2.1)
const notificationRoutes = require('./routes/notificationRoutes');
// MODULE 3 - Feature 2.1: Cron Jobs for Notifications
const { initializeCronJobs, stopCronJobs } = require('./jobs/cronJobs');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.use("/api/auth", authRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/document-submission', documentSubmissionRoutes);
app.use("/api/vendor", vendorRoutes);
app.use('/api/quotation-system', quotationSystemRoutes);
app.use('/api/consultants', consultantRoutes);
app.use('/api/university', universityRoutes);
app.use('/api/consultants', projectAssignmentRoutes);
app.use('/api/consultants', projectProgressRoutes);
app.use('/api/hire', hireRoutes);
// MODULE 2 - Task 2C: Infrastructure Service Routes
app.use('/api/infrastructure-services', infrastructureServiceRoutes);
// MODULE 2 - Task 2D: Lab Optimization Routes (temporarily at /api/optimization for testing)
app.use('/api/labs/optimization', labOptimizationRoutes);
// MODULE 3 - Feature 2.1: Notification Routes
app.use('/api/notifications', notificationRoutes);

app.get("/", (req, res) => {
  res.send("University Lab Procurement API Running");
});

const PORT = process.env.PORT || 5001;
const ENABLE_CRON = process.env.ENABLE_CRON !== "false"; // Default: enabled

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Initialize cron jobs if enabled
  if (ENABLE_CRON) {
    initializeCronJobs();
  } else {
    console.log("[CRON] Cron jobs are disabled (set ENABLE_CRON=true to enable)");
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n[SERVER] SIGTERM signal received: closing HTTP server");
  stopCronJobs();
  server.close(() => {
    console.log("[SERVER] HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n[SERVER] SIGINT signal received: closing HTTP server");
  stopCronJobs();
  server.close(() => {
    console.log("[SERVER] HTTP server closed");
    process.exit(0);
  });
});