const multer = require('multer');

const storage = multer.memoryStorage(); // CHANGED: diskStorage se memoryStorage

const upload = multer({ storage: storage });

module.exports = upload;