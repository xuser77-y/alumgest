const express = require('express');
const router = express.Router();
const { getClients, checkOrCreateClient } = require('../controllers/clientController');
const { protect, admin } = require('../middleware/auth');

router.route('/').get(protect, admin, getClients); 
router.post('/check', protect, admin, checkOrCreateClient);

module.exports = router;