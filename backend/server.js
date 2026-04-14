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
const projectAssignmentRoutes = require('./routes/projectAssignmentRoutes');
const projectProgressRoutes = require('./routes/projectProgressRoutes');
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
app.use('/api/consultants', projectAssignmentRoutes);
app.use('/api/consultants', projectProgressRoutes);

app.get("/", (req, res) => {
  res.send("University Lab Procurement API Running");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});