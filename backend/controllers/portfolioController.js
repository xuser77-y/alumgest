const PortfolioProject = require('../models/PortfolioProject');

let cloudinary   = null;
let streamifier  = null;

try {
  cloudinary  = require('cloudinary').v2;
  streamifier = require('streamifier');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} catch (_) {
  // packages not installed yet — uploads will respond with a clear error
}

/* helper: buffer → Cloudinary URL */
const uploadToCloudinary = (buffer, folder = 'portfolio') =>
  new Promise((resolve, reject) => {
    if (!cloudinary || !streamifier) {
      return reject(new Error('Cloudinary non configuré. Installez: npm install cloudinary streamifier'));
    }
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

/* ══════════════════════════════════════
   PUBLIC ENDPOINTS (no auth required)
══════════════════════════════════════ */

/* GET /api/portfolio
   ?category= &featured= &page= &limit=  */
exports.getPublished = async (req, res) => {
  try {
    const { category, featured, limit = 20, page = 1 } = req.query;
    const filter = { isPublished: true };
    if (category && category !== 'all') filter.category = category;
    if (featured === 'true')            filter.featured  = true;

    const skip = (Number(page) - 1) * Number(limit);
    const [projects, total] = await Promise.all([
      PortfolioProject.find(filter)
        .sort({ featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-__v'),
      PortfolioProject.countDocuments(filter),
    ]);

    res.json({
      projects,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error('getPublished:', err);
    res.status(500).json({ message: err.message });
  }
};

/* GET /api/portfolio/categories */
exports.getCategories = async (req, res) => {
  try {
    const cats = await PortfolioProject.distinct('category', { isPublished: true });
    res.json(cats.filter(Boolean).sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET /api/portfolio/:id */
exports.getOne = async (req, res) => {
  try {
    const project = await PortfolioProject.findById(req.params.id).select('-__v');
    if (!project)                                    return res.status(404).json({ message: 'Projet introuvable' });
    if (!project.isPublished && !req.user?.isAdmin)  return res.status(403).json({ message: 'Non publié' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ══════════════════════════════════════
   ADMIN ENDPOINTS (protected)
══════════════════════════════════════ */

/* GET /api/portfolio/admin/all */
exports.getAll = async (req, res) => {
  try {
    const { search, category, published } = req.query;
    const filter = {};
    if (search)             filter.title    = { $regex: search, $options: 'i' };
    if (category)           filter.category = category;
    if (published === 'true')  filter.isPublished = true;
    if (published === 'false') filter.isPublished = false;

    const projects = await PortfolioProject.find(filter)
      .sort({ createdAt: -1 })
      .select('title category location year isPublished featured coverImage createdAt');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* POST /api/portfolio */
exports.create = async (req, res) => {
  try {
    const {
      title, description, location, category, year,
      isPublished, featured, client, surface,
      coverImage, galleryImages,
    } = req.body;

    if (!title) return res.status(400).json({ message: 'Le titre est requis' });

    const project = await PortfolioProject.create({
      title, description, location, category,
      year:          Number(year) || new Date().getFullYear(),
      isPublished:   !!isPublished,
      featured:      !!featured,
      client,        surface,
      coverImage:    coverImage    || '',
      galleryImages: galleryImages || [],
    });
    res.status(201).json(project);
  } catch (err) {
    console.error('create:', err);
    res.status(500).json({ message: err.message });
  }
};

/* PUT /api/portfolio/:id */
exports.update = async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.year) update.year = Number(update.year);

    const project = await PortfolioProject.findByIdAndUpdate(
      req.params.id, update, { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ message: 'Projet introuvable' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* PATCH /api/portfolio/:id/publish */
exports.togglePublish = async (req, res) => {
  try {
    const project = await PortfolioProject.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Projet introuvable' });
    project.isPublished = !project.isPublished;
    await project.save();
    res.json({ _id: project._id, isPublished: project.isPublished });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* PATCH /api/portfolio/:id/featured */
exports.toggleFeatured = async (req, res) => {
  try {
    const project = await PortfolioProject.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Projet introuvable' });
    project.featured = !project.featured;
    await project.save();
    res.json({ _id: project._id, featured: project.featured });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* DELETE /api/portfolio/:id */
exports.remove = async (req, res) => {
  try {
    const project = await PortfolioProject.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Projet introuvable' });

    // Delete images from Cloudinary (best-effort, don't fail if it errors)
    if (cloudinary) {
      const all = [project.coverImage, ...project.galleryImages].filter(Boolean);
      for (const url of all) {
        try {
          const parts   = url.split('/');
          const file    = parts[parts.length - 1];          // e.g. "abc123.jpg"
          const folder  = parts[parts.length - 2];          // e.g. "portfolio"
          const publicId = `${folder}/${file.replace(/\.[^/.]+$/, '')}`;
          await cloudinary.uploader.destroy(publicId);
        } catch (_) {}
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* POST /api/portfolio/upload
   multer puts the file in req.file.buffer */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier reçu' });
    const result = await uploadToCloudinary(req.file.buffer, 'portfolio');
    res.json({
      url:       result.secure_url,
      public_id: result.public_id,
      width:     result.width,
      height:    result.height,
    });
  } catch (err) {
    console.error('uploadImage:', err);
    res.status(500).json({ message: err.message });
  }
};

/* DELETE /api/portfolio/upload  (delete a single image by public_id) */
exports.deleteImage = async (req, res) => {
  try {
    const { public_id } = req.body;
    if (!public_id) return res.status(400).json({ message: 'public_id requis' });
    if (cloudinary) await cloudinary.uploader.destroy(public_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};