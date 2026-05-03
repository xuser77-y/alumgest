const express = require('express');
const router = express.Router();
const { getDebts, createDebt, addPayment, updateDebt, deleteDebt } = require('../controllers/debtController');
const { protect, admin } = require('../middleware/auth');

router.use(protect);
router.use(admin);

router.get('/', getDebts);
router.post('/', createDebt);
router.post('/:id/payment', addPayment);
router.put('/:id', updateDebt);
router.delete('/:id', deleteDebt);

module.exports = router;
