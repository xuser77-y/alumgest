const express = require('express');
const router = express.Router();
const { getDebts, createDebt, addPayment, updateDebt, deleteDebt, updatePayment, deletePayment } = require('../controllers/debtController');
const { protect, admin } = require('../middleware/auth');

router.use(protect);
router.use(admin);

router.get('/', getDebts);
router.post('/', createDebt);
router.post('/:id/payment', addPayment);
router.put('/:id', updateDebt);
router.delete('/:id', deleteDebt);
router.put('/:id/payment/:paymentId', updatePayment);
router.delete('/:id/payment/:paymentId', deletePayment);

module.exports = router;
