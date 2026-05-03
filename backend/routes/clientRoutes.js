const express = require('express');
const router = express.Router();
const { getClients, checkOrCreateClient, getClientById, updateClient, deleteClient } = require('../controllers/clientController');
const { protect, admin } = require('../middleware/auth');

router.route('/').get(protect, admin, getClients); 
router.route('/:id')
  .get(protect, admin, getClientById)
  .put(protect, admin, updateClient)
  .delete(protect, admin, deleteClient);
router.post('/check', protect, admin, checkOrCreateClient);

module.exports = router;