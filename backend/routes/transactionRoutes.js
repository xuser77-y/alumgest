const express = require('express');
const router = express.Router();
const { createTransaction, getTransactions, getAvailableYears, getUniqueCategories } = require('../controllers/transactionController');
const { protect, admin } = require('../middleware/auth');

router.route('/').get(protect, admin, getTransactions).post(protect, admin, createTransaction);
router.get('/years', protect, admin, getAvailableYears);
router.get('/categories/unique', protect, admin, getUniqueCategories);
module.exports = router;