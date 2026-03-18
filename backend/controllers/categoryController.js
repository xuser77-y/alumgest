const Category = require('../models/Category');

// GET all categories (Both plus and minus)
exports.getCategories = async (req, res) => {
  try {
    const cats = await Category.find().sort({ name: 1 });
    res.json(cats);
  } catch (err) { res.status(500).json(err); }
};

// CREATE category
exports.createCategory = async (req, res) => {
  try {
    const newCat = new Category(req.body);
    await newCat.save();
    res.status(201).json(newCat);
  } catch (err) { res.status(400).json(err); }
};

// DELETE category
exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Supprimée" });
  } catch (err) { res.status(500).json(err); }
};