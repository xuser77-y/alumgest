const express = require('express');
const router = express.Router();
const {
  getFournisseurs,
  getFournisseurById,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
  addPurchase,
  addPayment
} = require('../controllers/fournisseurController');

router.get('/', getFournisseurs);
router.post('/', createFournisseur);

router.route('/:id')
  .get(getFournisseurById)
  .put(updateFournisseur)
  .delete(deleteFournisseur);

router.post('/:id/purchase', addPurchase);
router.post('/:id/payment', addPayment);

module.exports = router;
