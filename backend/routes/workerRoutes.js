const express = require('express');
const router = express.Router();
const { getWorkers, createWorker, deleteWorker , updateWorker , getWorkerProfile , getMyStats} = require('../controllers/workerController');
const { protect, admin } = require('../middleware/auth');

// All routes here are protected and for Admin only
router.use(protect);
router.get('/my-stats', protect, getMyStats);
router.use(admin);

router.route('/').get(getWorkers).post(createWorker);
router.route('/:id')
  .put(protect, admin, updateWorker) 
  .delete(protect, admin, deleteWorker);
router.get('/profile/:id', protect, admin, getWorkerProfile);

module.exports = router;