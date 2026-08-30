// File: src/controllers/locationController.js
const { getIndiaDataService } = require('../services/locationService');

const getStatesDistricts = (req, res) => {
  try {
    const data = getIndiaDataService();
    return res.status(200).json(data); // JSON response
  } catch (error) {
    console.error("[LOCATION] Error:", error);
    return res.status(500).json({ message: "Data fetch fail ho gaya" });
  }
};

// 🚨 Export karna mat bhoolna
module.exports = {
  getStatesDistricts
};