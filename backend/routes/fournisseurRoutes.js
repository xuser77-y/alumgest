const express = require('express');
const router = express.Router();
const {
  getFournisseurs,
  getFournisseurById,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
  addPurchase,
  addPayment,
  addCheque,
  addRemise,
  payCheque,
  updateHistory,
  deleteHistory
} = require('../controllers/fournisseurController');
const { protect } = require('../middleware/auth');

router.get('/', getFournisseurs);
router.post('/', createFournisseur);

router.route('/:id')
  .get(getFournisseurById)
  .put(updateFournisseur)
  .delete(deleteFournisseur);

router.post('/:id/purchase', addPurchase);
router.post('/:id/payment', addPayment);
router.post('/:id/cheque', addCheque);
router.post('/:id/remise', addRemise);

// History operations (Protected with password check)
router.post('/history/:historyId/pay', protect, payCheque);
router.put('/history/:historyId', protect, updateHistory);
router.delete('/history/:historyId', protect, deleteHistory);

module.exports = router;
