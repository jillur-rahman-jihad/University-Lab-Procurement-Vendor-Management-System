const express = require('express');
const app = express();

app.use(express.json());

// Simple auth middleware for testing
app.use((req, res, next) => {
  console.log(`[TEST SERVER] ${req.method} ${req.path}`);
  req.user = { id: 'test-id', role: 'university' };
  next();
});

// Mount lab optimization routes
const labOptimizationRoutes = require('./routes/labOptimizationRoutes');
app.use('/api/labs/optimization', labOptimizationRoutes);

app.listen(5001, () => {
  console.log('Test server on 5001');
});
