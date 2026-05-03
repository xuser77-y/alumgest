const express = require('express');
const router = express.Router();
const { getManagerStats, updateOwnPassword, resetWorkerPassword, exportBackupSecure } = require('../controllers/managerController');
const { protect, admin } = require('../middleware/auth');

router.get('/stats', protect, admin, getManagerStats);
router.put('/update-own-password', protect, admin, updateOwnPassword);
router.put('/reset-worker-password', protect, admin, resetWorkerPassword);

// SECURE EXPORT
router.post('/export-secure', protect, admin, exportBackupSecure);

module.exports = router;