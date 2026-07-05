const db = require('../DATABASE/mysql');

const Addcategory = (req, res) => {
  const { category_name } = req.body;
  const insertquery = 'INSERT INTO categories (category_name) VALUES (?)';

  // Fix: 'search_by_category' was undefined, replaced it with 'category_name'
  db.query(insertquery, [category_name], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: 'There is an issue with the database' });
    } else {
      return res.status(200).json({ success: true, message: 'Category saved successfully' });
    }
  });
};

const getcategory = (req, res) => {
  const getallcat = 'SELECT * FROM categories';

  db.query(getallcat, (err, result) => {
    if (err) {
      return res
        .status(400)
        .json({ success: false, message: 'There is a problem with the database' });
    } else {
      // Fix: Sending 'data: result' to the frontend is required, otherwise the dropdown will remain empty
      return res
        .status(200)
        .json({
          success: true,
          message: 'All categories fetched successfully',
          data: result,
        });
    }
  });
};

const Addsubcategory = (req, res) => {
  // Fix: Extracted 'subcategory_name' from req.body
  const { category_id, subcategory_name } = req.body;

  const sqlinsert =
    'INSERT INTO subcategories (category_id, subcategory_name) VALUES (?, ?)';

  // Fix: Passed the query first, followed by the [values] array in db.query
  db.query(sqlinsert, [category_id, subcategory_name], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: 'Failed to add subcategory', error: err.message });
    } else {
      return res.status(201).json({ success: true, message: 'Subcategory added successfully' });
    }
  });
};

const getsubcategories = (req, res) => {
  const getsub = req.params.category_id;
  const getsubcat = 'SELECT * FROM subcategories WHERE category_id = ?';

  // Fix: Corrected the variable order in db.query and returned the data properly
  db.query(getsubcat, [getsub], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    } else {
      return res
        .status(200)
        .json({
          success: true,
          message: 'Subcategories fetched successfully',
          data: result,
        });
    }
  });
};

module.exports = {
  Addcategory,
  getcategory, // This name now matches what will be exported to the router
  Addsubcategory,
  getsubcategories,
};