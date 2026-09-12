const multer = require('multer');
const storage = multer.memoryStorage(); // WAPAS MEMORY STORAGE
const upload = multer({ storage: storage });
module.exports = upload;