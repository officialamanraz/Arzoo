// File: src/config/cache.js
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 600 });

module.exports = myCache;