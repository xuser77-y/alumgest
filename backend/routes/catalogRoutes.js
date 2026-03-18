const express = require('express');
const router = express.Router();
const { getCatalog, addToCatalog, deleteFromCatalog } = require('../controllers/catalogController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(protect, admin, getCatalog)
  .post(protect, admin, addToCatalog);

router.route('/:id')
  .delete(protect, admin, deleteFromCatalog);

module.exports = router;