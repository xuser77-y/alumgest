const express = require('express');
const router = express.Router();
const { 
  getMonthlyReport, 
  getAvailableYears, // <--- Add this
  getWorkerMonthDetails, // <--- Add this
  confirmPayment, // <--- Add this
  getSingleWorkerStats,
  getWorkerSalaryHistory
} = require('../controllers/payrollController');
const { protect, admin } = require('../middleware/auth');

router.use(protect);
router.get('/years', getAvailableYears);
router.use(admin);

router.get('/report', getMonthlyReport);
 // This fixes the 404
router.get('/details/:workerId/:year/:month', getWorkerMonthDetails);
router.post('/confirm', confirmPayment);
router.get('/stats/:workerId/:year/:month', protect, admin, getSingleWorkerStats);
router.get('/history/:workerId', protect, admin, getWorkerSalaryHistory);

module.exports = router;