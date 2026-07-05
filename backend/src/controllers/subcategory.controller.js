const db = require('../../config/db');

const getSubcategories = (req, res) => {
  const { category_id } = req.query;

  if (!category_id) {
    return res.status(400).json({
      success: false,
      message: "category_id is required"
    });
  }

  const query = `
    SELECT subcategory_id, subcategory_name, category_id
    FROM subcategories
    WHERE category_id = ? AND is_active = 1
    ORDER BY subcategory_name ASC
  `;

  db.query(query, [category_id], (err, results) => {
    if (err) {
      console.error("Subcategories Error:", err);
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }

    return res.status(200).json({
      success: true,
      data: results || []
    });
  });
};

const addSubcategory = (req, res) => {
  const { subcategory_name, category_id } = req.body;

  if (!subcategory_name || !category_id) {
    return res.status(400).json({
      success: false,
      message: "Subcategory name and category ID are required"
    });
  }

  const query = `
    INSERT INTO subcategories (subcategory_name, category_id)
    VALUES (?, ?)
  `;

  db.query(query, [subcategory_name, category_id], (err, result) => {
    if (err) {
      console.error("Insert Error:", err);
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }

    return res.status(201).json({
      success: true,
      message: "Subcategory added successfully",
      subcategory_id: result.insertId
    });
  });
};

module.exports = { getSubcategories, addSubcategory };