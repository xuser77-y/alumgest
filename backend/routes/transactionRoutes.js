const express = require('express');
const router = express.Router();
const { 
  createTransaction, 
  getTransactions, 
  getAvailableYears, 
  getUniqueCategories,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transactionController');
const Transaction = require('../models/Transaction');
const { protect, admin } = require('../middleware/auth');

router.get('/ping', (req, res) => res.send('pong'));
router.get('/', protect, admin, getTransactions);
router.post('/', protect, admin, createTransaction);
router.get('/years', protect, admin, getAvailableYears);
router.get('/categories/unique', protect, admin, getUniqueCategories);

router.delete('/:id', protect, admin, deleteTransaction);

router.get('/:id', protect, admin, (req, res) => {
   Transaction.findById(req.params.id).then(t => res.json(t)).catch(err => res.status(404).json(err));
});
router.put('/:id', protect, admin, updateTransaction);

module.exports = router;