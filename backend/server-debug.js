const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const labRoutes = require('./routes/labRoutes');
const infrastructureServiceRoutes = require('./routes/infrastructureServiceRoutes');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Log routes being registered
console.log('\n=== REGISTERING ROUTES ===');

const labRouter = labRoutes;
console.log('Lab routes total:', labRouter.stack?.length || 0);
labRouter.stack?.forEach((layer, i) => {
  if (layer.route) {
    const method = Object.keys(layer.route.methods)[0].toUpperCase();
    console.log(`  [${i}] ${method} ${layer.route.path}`);
  }
});

app.use('/api/labs', labRouter);

const infraRouter = infrastructureServiceRoutes;
console.log('\nInfra routes total:', infraRouter.stack?.length || 0);
infraRouter.stack?.forEach((layer, i) => {
  if (layer.route) {
    const method = Object.keys(layer.route.methods)[0].toUpperCase();
    console.log(`  [${i}] ${method} ${layer.route.path}`);
  }
});

app.use('/api/infrastructure-services', infraRouter);

app.get("/", (req, res) => {
  res.send("University Lab Procurement API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\nServer running on port ${PORT}\n`);
});
