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
// Consultant Rating & Ranking System Routes
const consultantRRSystemRoutes = require('./routes/consultantRRSystemRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const postDeploymentRoutes = require('./routes/postDeploymentRoutes');
const infrastructureOptimizationRoutes = require('./routes/infrastructureOptimizationRoutes');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.use("/api/auth", authRoutes);
app.use('/api/labs', labRoutes);
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
// Consultant Rating & Ranking System Routes
app.use('/api/consultant-ranking', consultantRRSystemRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/post-deployment-support', postDeploymentRoutes);
app.use('/api/infrastructure-optimization', infrastructureOptimizationRoutes);

app.get("/", (req, res) => {
  res.send("University Lab Procurement API Running");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});