const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');

// --- 1. GET ATTENDANCE ---
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const d = new Date(date);
    const day = d.getDate();
    let m = d.getMonth() + 1;
    let y = d.getFullYear();
    if (day > 10) m++;
    if (m > 12) { m = 1; y++; }

    const records = await Attendance.find({ date });
    const paidRecords = await Payroll.find({ month: m, year: y });
    const paidWorkerIds = paidRecords.map(p => p.workerId.toString());

    res.json({
      records,
      lockedWorkerIds: paidWorkerIds 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- 2. SAVE ATTENDANCE ---
exports.saveAttendance = async (req, res) => {
  const { date, records } = req.body; 
  
  const d = new Date(date);
  const day = d.getDate();
  let m = d.getMonth() + 1;
  let y = d.getFullYear();
  if (day > 10) m++;
  if (m > 12) { m = 1; y++; }

  try {
    // 1. Get all workers already paid for THIS specific period
    const paidRecords = await Payroll.find({ month: m, year: y });
    const paidIds = paidRecords.map(p => p.workerId.toString());

    // 2. Filter records to only save workers who are NOT paid yet
    const promises = records.map(rec => {
      // If this worker is already paid, skip him
      if (paidIds.includes(rec.workerId)) return null;

      return Attendance.findOneAndUpdate(
        { workerId: rec.workerId, date: date },
        { status: rec.status, displacement: rec.displacement },
        { upsert: true, returnDocument: 'after' }
      );
    });

    await Promise.all(promises.filter(p => p !== null));
    res.json({ message: "Enregistré (Les ouvriers déjà payés ont été ignorés)." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};