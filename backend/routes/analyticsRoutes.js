const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/auth');

router.use(protect);
router.use(admin);

router.get('/years',    controller.getYears);
router.get('/overview', controller.getOverview);
router.get('/monthly',  controller.getMonthly);
router.get('/yearly',   controller.getYearly);
router.get('/workers',  controller.getWorkers);
router.get('/dashboard', controller.getDashboardStats); 

module.exports = router;