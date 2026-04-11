const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('[UPLOAD] Created uploads directory');
}

// Set storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('[UPLOAD MIDDLEWARE] Destination callback');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('[UPLOAD MIDDLEWARE] Generated filename:', filename);
    cb(null, filename);
  }
});

// Filter for image files only
const fileFilter = (req, file, cb) => {
  console.log('[UPLOAD MIDDLEWARE] File filter - mimetype:', file.mimetype);
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.error('[UPLOAD MIDDLEWARE] Invalid file type:', file.mimetype);
    cb(new Error('Only image files are allowed'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;
