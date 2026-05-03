const Client = require('../models/Client');

// 1. GET ALL CLIENTS (Needed for the dropdown)
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ name: 1 });
    res.json(clients);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
};

// 2. SMART CREATE (Removed unique phone restriction)
exports.checkOrCreateClient = async (req, res) => {
  const { name, phone, address, email } = req.body;
  try {
    const newClient = new Client({ name, phone, address, email });
    await newClient.save();
    res.status(201).json({ exists: false, client: newClient });
  } catch (err) {
    res.status(400).json({ message: "Erreur creation client" });
  }
};

// 3. GET CLIENT BY ID
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client non trouvé' });
    
    // Also fetch their projects
    const Project = require('../models/Project');
    const projects = await Project.find({ client: client._id }).sort({ createdAt: -1 });
    
    res.json({ client, projects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. UPDATE CLIENT
exports.updateClient = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const client = await Client.findByIdAndUpdate(req.params.id, { name, phone, email, address }, { new: true });
    if (!client) return res.status(404).json({ message: 'Client non trouvé' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5. DELETE CLIENT
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client non trouvé' });
    
    await Client.findByIdAndDelete(req.params.id);
    res.json({ message: 'Client supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};