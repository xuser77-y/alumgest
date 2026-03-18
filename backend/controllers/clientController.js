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

// 2. SMART CHECK/CREATE (What we built last time)
exports.checkOrCreateClient = async (req, res) => {
  const { name, phone, address, email } = req.body;
  try {
    let client = await Client.findOne({ phone });
    if (client) return res.json({ exists: true, client });

    const newClient = new Client({ name, phone, address, email });
    await newClient.save();
    res.status(201).json({ exists: false, client: newClient });
  } catch (err) {
    res.status(400).json({ message: "Erreur creation client" });
  }
};