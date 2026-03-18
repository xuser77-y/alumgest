const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const Project = require('./models/Project');    
const Transaction = require('./models/Transaction');
const User = require('./models/User');
const Category = require('./models/Category');
const Catalog = require('./models/Catalog');
const portfolioRoutes = require('./routes/portfolioRoutes');
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
// Connect DB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected!');
  } catch (err) {
    console.log('DB Error, retrying in 5s...', err.message);
    setTimeout(connectDB, 5000); 
  }
};

connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/workers', require('./routes/workerRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/manager', require('./routes/managerRoutes'));
app.use('/api/catalog', require('./routes/catalogRoutes'));
app.use('/api/portfolio', require('./routes/portfolioRoutes'));
// --- 💰 ADD ADVANCE PAYMENT ROUTE ---
app.post('/api/projects/:id/advance', async (req, res) => {
  const { amount, description } = req.body;
  
  try {
    // 1. Find the project
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Projet non trouvé" });

    // 2. Update advance payment
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return res.status(400).json({ message: "Montant invalide" });

    project.advancePayment += numericAmount;
    await project.save();

    // 3. Record in Bank (Transaction)
    const transaction = new Transaction({
      type: 'plus',
      category: 'Revenus',
      amount: numericAmount,
      description: `Encaissement : ${project.projectName} ${description ? '('+description+')' : ''}`,
      projectId: project._id,
      isSettled: true // Client payments are automatically settled
    });
    
    await transaction.save();

    res.json(project);

  } catch (err) {
    console.error("❌ Erreur Backend:", err.message);
    res.status(500).json({ message: err.message });
  }
});



app.listen(PORT, () => console.log(`Server started on port ${PORT}`));