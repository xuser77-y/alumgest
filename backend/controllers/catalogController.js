const Catalog = require('../models/Catalog');

exports.getCatalog = async (req, res) => {
  try {
    const items = await Catalog.find().sort({ name: 1 });
    res.json(items);
  } catch (err) { res.status(500).json(err); }
};

exports.addToCatalog = async (req, res) => {
  try {
    const newItem = new Catalog(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) { res.status(400).json(err); }
};

exports.deleteFromCatalog = async (req, res) => {
  try {
    await Catalog.findByIdAndDelete(req.params.id);
    res.json({ message: "Supprimé" });
  } catch (err) { res.status(500).json(err); }
};