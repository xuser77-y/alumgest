const Project     = require('../models/Project');
const Transaction = require('../models/Transaction');
const Attendance  = require('../models/Attendance');
const User        = require('../models/User');

const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

const dateRange = (year, month = null) => {
  if (month) {
    const pad   = String(month).padStart(2,'0');
    const start = new Date(`${year}-${pad}-01T00:00:00.000Z`);
    const end   = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setMilliseconds(-1);
    return { $gte: start, $lte: end };
  }
  return {
    $gte: new Date(`${year}-01-01T00:00:00.000Z`),
    $lte: new Date(`${year}-12-31T23:59:59.999Z`),
  };
};

/* ═══════════════════════════════════════════════════════
   0. GET /api/analytics/years
   Returns distinct years that have Transaction data + project years
═══════════════════════════════════════════════════════ */
exports.getYears = async (req, res) => {
  try {
    // Get distinct years from transactions
    const txYears = await Transaction.aggregate([
      { $group: { _id: { $year: '$date' } } },
      { $sort:  { _id: 1 } },
    ]);
    // Also get from projects (createdAt)
    const projYears = await Project.aggregate([
      { $group: { _id: { $year: '$createdAt' } } },
      { $sort:  { _id: 1 } },
    ]);

    const allYears = [
      ...new Set([
        ...txYears.map(y   => y._id),
        ...projYears.map(y => y._id),
      ])
    ].sort((a, b) => a - b);

    // Always include current year even if no data yet
    const currentYear = new Date().getFullYear();
    if (!allYears.includes(currentYear)) allYears.push(currentYear);

    res.json({ years: allYears.map(String) });
  } catch (err) {
    console.error('Analytics/years error:', err);
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════
   1. GET /api/analytics/overview?year=2024
═══════════════════════════════════════════════════════ */
exports.getOverview = async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  try {
    const projects       = await Project.find({}).populate('client');
    const activeCount    = projects.filter(p => p.status === 'active').length;
    const completedCount = projects.filter(p => p.status === 'completed').length;
    const archivedCount  = projects.filter(p => p.status === 'archived').length;

    const transactions = await Transaction.find({ date: dateRange(year) });
    const totalIn  = transactions.filter(t => t.type === 'plus' ).reduce((s,t) => s + t.amount, 0);
    const totalOut = transactions.filter(t => t.type === 'minus').reduce((s,t) => s + t.amount, 0);

    const rawMonthly = await Transaction.aggregate([
      { $match: { date: dateRange(year) } },
      { $group: { _id: { month: { $month: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
    ]);
    const monthly = MONTHS_FR.map((m, i) => {
      const n   = i + 1;
      const rev = rawMonthly.find(d => d._id.month === n && d._id.type === 'plus' )?.total || 0;
      const dep = rawMonthly.find(d => d._id.month === n && d._id.type === 'minus')?.total || 0;
      return { month: m, revenus: rev, depenses: dep, marge: rev - dep };
    });
    const bestMonth = monthly.reduce((b, m) => m.marge > b.marge ? m : b, monthly[0]);

    const catSpend = await Transaction.aggregate([
      { $match: { type: 'minus', date: dateRange(year) } },
      { $group: { _id: '$category', amount: { $sum: '$amount' } } },
      { $sort:  { amount: -1 } },
    ]);
    const catIncome = await Transaction.aggregate([
      { $match: { type: 'plus', date: dateRange(year) } },
      { $group: { _id: '$category', amount: { $sum: '$amount' } } },
      { $sort:  { amount: -1 } },
    ]);
    const totalSpend  = catSpend.reduce((s,c)  => s + c.amount, 0);
    const totalIncome = catIncome.reduce((s,c) => s + c.amount, 0);

    const allTasks = projects.flatMap(p => p.items);
    const taskDist = ['cutting','assembly','glass','ready','finished'].map(s => ({
      status: s, count: allTasks.filter(t => t.status === s).length,
    }));

    const projectsTable = projects.map(p => ({
      _id:       p._id,
      name:      p.projectName,
      client:    p.client?.name || '—',
      revenue:   p.totalPrice,
      spent:     p.finalSpent,
      margin:    p.totalPrice - p.finalSpent,
      marginPct: p.totalPrice > 0 ? Math.round(((p.totalPrice - p.finalSpent) / p.totalPrice) * 100) : 0,
      status:    p.status,
      tasks:     p.items.length,
    }));

    res.json({
      kpis: { totalIn, totalOut, margin: totalIn - totalOut, activeCount, completedCount, archivedCount, bestMonth: bestMonth?.month || '—' },
      monthly,
      categorySpending: catSpend.map(c  => ({ name: c._id, amount: c.amount, pct: totalSpend  > 0 ? Math.round((c.amount / totalSpend)  * 100) : 0 })),
      categoryIncome:   catIncome.map(c => ({ name: c._id, amount: c.amount, pct: totalIncome > 0 ? Math.round((c.amount / totalIncome) * 100) : 0 })),
      taskDist,
      projectsTable,
    });
  } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
};

/* ═══════════════════════════════════════════════════════
   2. GET /api/analytics/monthly?year=2024
═══════════════════════════════════════════════════════ */
exports.getMonthly = async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  try {
    const raw = await Transaction.aggregate([
      { $match: { date: dateRange(year) } },
      { $group: { _id: { month: { $month: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
    ]);
    const salaryRaw = await Transaction.aggregate([
      { $match: { date: dateRange(year), type: 'minus', category: { $regex: /salaire/i } } },
      { $group: { _id: { $month: '$date' }, total: { $sum: '$amount' } } },
    ]);

    const monthly = MONTHS_FR.map((m, i) => {
      const n   = i + 1;
      const rev = raw.find(d => d._id.month === n && d._id.type === 'plus' )?.total || 0;
      const dep = raw.find(d => d._id.month === n && d._id.type === 'minus')?.total || 0;
      const sal = salaryRaw.find(d => d._id === n)?.total || 0;
      return { month: m, monthNum: n, revenus: rev, depenses: dep, salaires: sal, marge: rev - dep };
    });

    let cumul = 0;
    const cumulData = monthly.map(m => { cumul += m.revenus; return { ...m, cumul }; });

    const catSpend = await Transaction.aggregate([
      { $match: { type: 'minus', date: dateRange(year) } },
      { $group: { _id: '$category', amount: { $sum: '$amount' } } },
      { $sort:  { amount: -1 } },
    ]);
    const catIncome = await Transaction.aggregate([
      { $match: { type: 'plus', date: dateRange(year) } },
      { $group: { _id: '$category', amount: { $sum: '$amount' } } },
      { $sort:  { amount: -1 } },
    ]);
    const totalSpend  = catSpend.reduce((s,c)  => s + c.amount, 0);
    const totalIncome = catIncome.reduce((s,c) => s + c.amount, 0);

    res.json({
      monthly,
      cumulData,
      categorySpending: catSpend.map(c  => ({ name: c._id, amount: c.amount, pct: totalSpend  > 0 ? Math.round((c.amount / totalSpend)  * 100) : 0 })),
      categoryIncome:   catIncome.map(c => ({ name: c._id, amount: c.amount, pct: totalIncome > 0 ? Math.round((c.amount / totalIncome) * 100) : 0 })),
      totals: { totalSpend, totalIncome },
    });
  } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
};

/* ═══════════════════════════════════════════════════════
   3. GET /api/analytics/yearly
═══════════════════════════════════════════════════════ */
exports.getYearly = async (req, res) => {
  try {
    // Get years dynamically from DB
    const txYears   = await Transaction.aggregate([{ $group: { _id: { $year: '$date' } } }, { $sort: { _id: 1 } }]);
    const projYears = await Project.aggregate([{ $group: { _id: { $year: '$createdAt' } } }, { $sort: { _id: 1 } }]);
    const allYears  = [...new Set([...txYears.map(y => y._id), ...projYears.map(y => y._id)])].sort();
    const cur = new Date().getFullYear();
    if (!allYears.includes(cur)) allYears.push(cur);

    const yearlyData = await Promise.all(allYears.map(async (y) => {
      const txs      = await Transaction.find({ date: dateRange(y) });
      const revenus  = txs.filter(t => t.type === 'plus' ).reduce((s,t) => s + t.amount, 0);
      const depenses = txs.filter(t => t.type === 'minus').reduce((s,t) => s + t.amount, 0);
      const projets  = await Project.countDocuments({
        createdAt: { $gte: new Date(`${y}-01-01`), $lte: new Date(`${y}-12-31T23:59:59.999Z`) }
      });
      return { year: String(y), revenus, depenses, marge: revenus - depenses, projets };
    }));

    const withGrowth = yearlyData.map((y, i) => {
      const prev = yearlyData[i - 1];

      const growth =
        i > 0 && prev.revenus > 0
          ? Math.round(((y.revenus - prev.revenus) / prev.revenus) * 100)
          : 0;

      const margeGrowth =
        i > 0 && prev.marge !== 0
          ? Math.round(((y.marge - prev.marge) / prev.marge) * 100)
          : 0;

      return {
        ...y,
        growth,
        margeGrowth,
        tauxMarge: y.revenus > 0 ? Math.round((y.marge / y.revenus) * 100) : 0,
      };
    });

    res.json({ yearly: withGrowth });
  } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
};

/* ═══════════════════════════════════════════════════════
   4. GET /api/analytics/workers?year=2024
═══════════════════════════════════════════════════════ */
exports.getWorkers = async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  try {
    const workers  = await User.find({ role: 'worker' });
    const projects = await Project.find({});

    const workerPerf = await Promise.all(workers.map(async (w) => {
      const fullDays      = await Attendance.countDocuments({ workerId: w._id, status: 'full',   date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` } });
      const halfDays      = await Attendance.countDocuments({ workerId: w._id, status: 'half',   date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` } });
      const absentDays    = await Attendance.countDocuments({ workerId: w._id, status: 'absent', date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` } });
      const displacements = await Attendance.countDocuments({ workerId: w._id, displacement: true, date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` } });

      const tasksFinished = projects.reduce((acc, p) =>
        acc + p.items.filter(item => item.assignedWorker?.toString() === w._id.toString() && item.status === 'finished').length, 0);

      const totalDays = fullDays + halfDays * 0.5;
      const salary    = Math.round(totalDays * w.dailySalary);
      const score     = Math.min(100, Math.round((fullDays / 250) * 60 + (tasksFinished / 50) * 40));

      const monthlyAtt = await Promise.all(MONTHS_FR.map(async (m, i) => {
        const pad  = String(i + 1).padStart(2,'0');
        const days = await Attendance.countDocuments({
          workerId: w._id, status: { $in: ['full','half'] },
          date: { $gte: `${year}-${pad}-01`, $lte: `${year}-${pad}-31` },
        });
        return { month: m, days };
      }));

      return { _id: w._id, name: w.name, poste: w.poste, dailySalary: w.dailySalary, fullDays, halfDays, absentDays, displacements, tasksFinished, totalDays, salary, score, monthlyAtt };
    }));

    workerPerf.sort((a, b) => b.score - a.score);

    res.json({
      workers:  workerPerf,
      teamKpis: {
        totalSalary:   workerPerf.reduce((s,w) => s + w.salary, 0),
        avgAttendance: Math.round(workerPerf.reduce((s,w) => s + w.fullDays, 0) / (workerPerf.length || 1)),
        totalAbsences: workerPerf.reduce((s,w) => s + w.absentDays, 0),
        totalTasks:    workerPerf.reduce((s,w) => s + w.tasksFinished, 0),
      },
    });
  } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
};














exports.getDashboardStats = async (req, res) => {
  try {
    const [projects, transactions, workers] = await Promise.all([
      Project.find({}).populate('client', 'name'),
      Transaction.find({}),
      User.find({ role: 'worker' }),
    ]);

    /* ── 1. Financials ── */
    const totalIn  = transactions.filter(t => t.type === 'plus' ).reduce((s, t) => s + t.amount, 0);
    const totalOut = transactions.filter(t => t.type === 'minus').reduce((s, t) => s + t.amount, 0);

    const totalProjectValue = projects.reduce((s, p) => s + (p.totalPrice      || 0), 0);
    const totalCollected    = projects.reduce((s, p) => s + (p.advancePayment  || 0), 0);
    const clientDebt        = Math.max(0, totalProjectValue - totalCollected);

    /* ── 2. Monthly Trend — last 6 months (year-aware) ── */
    const now = new Date();
    const monthlyTrend = [];

    for (let i = 5; i >= 0; i--) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m   = ref.getMonth();
      const y   = ref.getFullYear();
      const label = ref.toLocaleString('fr-FR', { month: 'short' });

      const inMonth = t => {
        const d = new Date(t.date);
        return d.getMonth() === m && d.getFullYear() === y;
      };

      const revenus  = transactions.filter(t => t.type === 'plus'  && inMonth(t)).reduce((s, t) => s + t.amount, 0);
      const depenses = transactions.filter(t => t.type === 'minus' && inMonth(t)).reduce((s, t) => s + t.amount, 0);

      monthlyTrend.push({ month: label, revenus, depenses, marge: revenus - depenses });
    }

    /* ── 3. Task distribution across all active projects ── */
    const activeProjects = projects.filter(p => p.status === 'active');
    const taskCountMap   = {};
    activeProjects.forEach(p => {
      (p.items || []).forEach(item => {
        taskCountMap[item.status] = (taskCountMap[item.status] || 0) + 1;
      });
    });
    const taskDist = Object.entries(taskCountMap).map(([status, count]) => ({ status, count }));

    /* ── 4. Workers with salary data ── */
    const workersData = workers.map(w => ({
      _id:        w._id,
      name:       w.name || w.username,
      poste:      w.poste,
      dailySalary:w.dailySalary || 0,
    }));

    /* ── 5. Top project by profit margin ── */
    const projectsWithMargin = projects.map(p => ({
      _id:         p._id,
      projectName: p.projectName,
      client:      p.client,
      totalPrice:  p.totalPrice   || 0,
      finalSpent:  p.finalSpent   || 0,
      status:      p.status,
      margin:      (p.totalPrice  || 0) - (p.finalSpent || 0),
      marginPct:   p.totalPrice > 0
        ? Math.round(((p.totalPrice - (p.finalSpent || 0)) / p.totalPrice) * 100)
        : 0,
      createdAt:   p.createdAt,
    }));

    /* ── 6. Category spending breakdown (top 5) ── */
    const catMap = {};
    transactions.filter(t => t.type === 'minus').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const categorySpending = Object.entries(catMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    /* ── Response ── */
    res.json({
      kpis: {
        cashInPocket:      totalIn - totalOut,
        activeProjects:    activeProjects.length,
        completedProjects: projects.filter(p => p.status === 'completed').length,
        clientDebt,
        totalWorkers:      workers.length,
        totalIn,
        totalOut,
        totalProjectValue,
        recoveryRate: totalProjectValue > 0
          ? Math.round((totalCollected / totalProjectValue) * 100)
          : 0,
      },
      monthlyTrend,
      taskDist,
      categorySpending,
      recentProjects: projectsWithMargin
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
      topProjects: projectsWithMargin
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 5),
      workers: workersData,
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Erreur serveur dashboard', error: err.message });
  }
};