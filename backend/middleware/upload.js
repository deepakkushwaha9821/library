const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = ['uploads/covers', 'uploads/ebooks', 'uploads/audio'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'cover') {
      cb(null, path.join(__dirname, '../uploads/covers'));
    } else if (file.fieldname === 'ebookFile') {
      cb(null, path.join(__dirname, '../uploads/ebooks'));
    } else if (file.fieldname === 'audioFiles' || file.fieldname === 'sampleAudio') {
      cb(null, path.join(__dirname, '../uploads/audio'));
    } else {
      cb(null, path.join(__dirname, '../uploads'));
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'cover') {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed for cover!'), false);
  } else if (file.fieldname === 'ebookFile') {
    if (file.mimetype === 'application/pdf' || file.mimetype.includes('epub') || file.originalname.endsWith('.pdf') || file.originalname.endsWith('.epub')) {
      cb(null, true);
    } else cb(new Error('Only PDF or EPUB allowed for eBook file!'), false);
  } else if (file.fieldname === 'audioFiles' || file.fieldname === 'sampleAudio') {
    if (file.mimetype.startsWith('audio/') || file.originalname.endsWith('.mp3')) cb(null, true);
    else cb(new Error('Only MP3/audio files allowed!'), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit per file
});

module.exports = upload;
