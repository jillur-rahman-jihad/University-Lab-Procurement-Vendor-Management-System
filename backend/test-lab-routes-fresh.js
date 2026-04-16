// Fresh test of labRoutes mounted directly
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const labController = require('./controllers/labController');
const authenticateToken = require('./middleware/authMiddleware');
const multer = require('multer');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const upload = multer({ storage: multer.memoryStorage() });

// ============ CREATE FRESH ROUTER ============
const router = express.Router();

// ORIGINAL ROUTES
router.post('/create', authenticateToken, labController.createLabProject);
router.post('/upload-pdf', authenticateToken, upload.single('document'), labController.uploadAndParsePDF);

// MODULE 2 - Task 2B: Lab Planning & Procurement Management
// Equipment Requests
router.post('/lab-equipment-request', authenticateToken, labController.requestEquipment);
router.get('/my-equipment-requests', authenticateToken, labController.getUniversityEquipmentRequests);
router.get('/equipment-catalog', authenticateToken, labController.getAvailableEquipment);
router.get('/equipment/:id', authenticateToken, labController.getEquipmentDetails);
router.put('/equipment-request/:id', authenticateToken, labController.updateEquipmentRequestStatus);

// Procurement  
router.post('/procurement/:id', authenticateToken, labController.submitProcurement);
router.get('/procurement-order/:id', authenticateToken, labController.getProcurementDetails);
router.put('/procurement/:id', authenticateToken, labController.updateProcurementStatus);

// Lab Projects
router.get('/available-lab-projects', authenticateToken, labController.getAvailableProjects);
router.post('/assign-lab-project', authenticateToken, labController.assignProject);
router.get('/my-lab-projects', authenticateToken, labController.getUniversityProjectAssignments);

console.log('\n=== TEST SERVER ===');
console.log('Routes in router:', router.stack.length);
router.stack.forEach((layer, i) => {
  if (layer.route) {
    const method = Object.keys(layer.route.methods)[0].toUpperCase();
    console.log(`  [${i}] ${method} ${layer.route.path}`);
  }
});

// Mount router
app.use('/api/labs', router);

const PORT = 6004;
app.listen(PORT, () => {
  console.log(`\nServer running on port ${PORT}\n`);
  
  // Test routes
  const http = require('http');
  const tests = [
    '/api/labs/create',
    '/api/labs/lab-equipment-request',
    '/api/labs/my-equipment-requests',
    '/api/labs/equipment-catalog',
    '/api/labs/available-lab-projects',
    '/api/labs/assign-lab-project'
  ];
  
  let count = 0;
  tests.forEach(path => {
    const method = path.includes('equipment') || path.includes('available') || path.includes('my') ? 'GET' : 'POST';
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      console.log(path.padEnd(35), res.statusCode);
      if (++count === tests.length) process.exit(0);
    });
    req.on('error', () => { if (++count === tests.length) process.exit(1); });
    req.write(JSON.stringify({}));
    req.end();
  });
});
