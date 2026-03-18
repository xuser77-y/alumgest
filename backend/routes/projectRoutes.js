const express = require('express');
const router = express.Router();
const { 
  getProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject,
  completeProject,
  addTaskToProject,
  updateTaskStatus,
  updateTaskFull,
  deleteTask,
  getProjectExpenses,
  getWorkerTasks,
  finishAllTasks
} = require('../controllers/projectController');
const { protect, admin } = require('../middleware/auth');

// All project routes are protected and for Admin only
router.use(protect);
router.get('/my-tasks', protect, getWorkerTasks);
router.patch('/:projectId/tasks/:taskId', updateTaskStatus);
router.patch('/:id/tasks-finish-all', protect, admin, finishAllTasks);
router.use(admin);

// ── PROJECT MANAGEMENT ──
router.route('/')
  .get(getProjects)      // Get by status (active/completed/archived)
  .post(createProject);  // Create new Villa

router.route('/:id')
  .get(getProjectById)   // Open specific project
  .put(updateProject)    // Update financials (Total Price, Advance)
  .delete(deleteProject);


router.get('/:id/expenses', getProjectExpenses);
router.post('/:id/complete', protect, admin, completeProject); // <── Clôture de chantier
// ── TASK (ITEM) MANAGEMENT ──
router.post('/:id/tasks', addTaskToProject); // Add Window/Door

router.route('/:projectId/tasks/:taskId') 
  .put(updateTaskFull)     // Edit dimensions/assigned worker
  .delete(deleteTask);     // Remove window from list


module.exports = router;