// server/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
  './uploads/templates',
  './uploads/pdfs',
  './uploads/previews'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = './uploads';
    
    if (file.fieldname === 'thumbnail') {
      uploadPath = './uploads/templates';
    } else if (file.fieldname === 'pdf') {
      uploadPath = './uploads/pdfs';
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'thumbnail': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'pdf': ['application/pdf'],
    'file': ['application/json', 'text/html', 'application/octet-stream']
  };
  
  const fieldTypes = allowedTypes[file.fieldname] || allowedTypes.file;
  
  if (fieldTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.fieldname}. Allowed types: ${fieldTypes.join(', ')}`), false);
  }
};

// Configure upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  }
});

module.exports = upload;