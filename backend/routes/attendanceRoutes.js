const express = require('express');
const router = express.Router();

const { getAttendanceByDate, saveAttendance } = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/auth');

router.use(protect);
router.use(admin);

router.get('/:date', getAttendanceByDate);
router.post('/bulk', saveAttendance); // This is line 10 where it was crashing

module.exports = router;