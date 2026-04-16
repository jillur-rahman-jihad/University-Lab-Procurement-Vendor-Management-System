const express = require('express');
const router = express.Router();

console.log('[DEBUG-ROUTES] SimpleLabRoutes loaded');

// TEST ROUTES ONLY
router.get('/debug-test', (req, res) => {
  res.json({ message: 'Debug test route works WITHOUT auth' });
});

router.post('/debug-test-2', (req, res) => {
  res.json({ message: 'Debug test route 2 works' });
});

router.post('/create', (req, res) => {
  res.json({ message: 'Create route (no auth for debug)' });
});

console.log('[DEBUG-ROUTES] All debug routes registered');

module.exports = router;
