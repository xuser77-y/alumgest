// routes/portfolioRoutes.js
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const ctrl    = require('../controllers/portfolioController');
const { protect, admin } = require('../middleware/auth');

/* multer: store uploads in memory, send to Cloudinary */
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seules les images sont acceptées'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/* ── PUBLIC ──────────────────────────────────────────────────── */
router.get('/categories',     ctrl.getCategories);   // distinct categories of published projects
router.get('/admin/all',      protect, admin, ctrl.getAll);    // ← must be BEFORE /:id
router.get('/',               ctrl.getPublished);    // ?category= &featured= &page= &limit=
router.get('/:id',            ctrl.getOne);          // single project (published only for public)

/* ── ADMIN ───────────────────────────────────────────────────── */
router.post('/',              protect, admin, ctrl.create);
router.put('/:id',            protect, admin, ctrl.update);
router.delete('/:id',         protect, admin, ctrl.remove);
router.patch('/:id/publish',  protect, admin, ctrl.togglePublish);
router.patch('/:id/featured', protect, admin, ctrl.toggleFeatured);

/* ── IMAGE UPLOAD ────────────────────────────────────────────── */
router.post('/upload',        protect, admin, upload.single('image'), ctrl.uploadImage);
router.delete('/upload',      protect, admin, ctrl.deleteImage);

module.exports = router;