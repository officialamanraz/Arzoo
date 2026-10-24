const multer = require('multer');
const storage = multer.memoryStorage(); // WAPAS MEMORY STORAGE
const upload = multer({ storage: storage,
    limits: { 
    fileSize: 150 * 1024 * 1024 // 150 MB max file size limit (suitable for 4K videos & high-res images)
  }
 });
module.exports = upload;