const express = require('express');
const router = express.Router();

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Simple test route works!' });
});

console.log('[TEST-ROUTER] Simple test router created');

module.exports = router;
