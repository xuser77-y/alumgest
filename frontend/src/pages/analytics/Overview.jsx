import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  LayoutDashboard, FolderOpen, Layers, TrendingUp,
  ArrowUpRight, ArrowDownRight, Activity, Wallet, Package,
} from 'lucide-react';
import api from '../../services/api';
import useAnalyticsYears from './useAnalyticsYears';
import './Analytics.css';

const PIE_COLORS = ['#1870e0','#16b870','#f0a81a','#7c5cf4','#ee3f58','#14b8a6','#4fa3ff','#a78bfa'];
const fmt  = n => Number(n || 0).toLocaleString('fr-MA');
const fmtK = n => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n;

const TASK_LABELS = { cutting:'Découpe', assembly:'Assemblage', glass:'Vitrage', ready:'Prêt', finished:'Terminé' };
const TASK_COLORS = { cutting:'#ee3f58', assembly:'#f0a81a', glass:'#7c5cf4', ready:'#4fa3ff', finished:'#16b870' };

const AnTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="an-tooltip">
      <div className="an-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="an-tooltip-row" style={{ color: p.color }}>
          <span>{p.name}</span><span>{fmt(p.value)} DH</span>
        </div>
      ))}
    </div>
  );
};

const YearSelect = ({ years, value, onChange }) => (
  <select className="an-yr-sel" value={value} onChange={e => onChange(e.target.value)}>
    {years.map(y => <option key={y} value={y}>{y}</option>)}
  </select>
);

export default function Overview() {
  const { years } = useAnalyticsYears();
  const [year,    setYear]    = useState(String(new Date().getFullYear()));
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics/overview?year=${year}`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [year]);

  if (loading) return (
    <div className="an-page">
      <div className="an-loader"><div className="an-loader-ring"/><span>Chargement des données...</span></div>
    </div>
  );
  if (!data) return <div className="an-page" style={{ color:'var(--an-red)' }}>Erreur de chargement</div>;

  const { kpis, monthly, categorySpending, categoryIncome, taskDist, projectsTable } = data;
  const marginPct   = kpis.totalIn > 0 ? Math.round((kpis.margin / kpis.totalIn) * 100) : 0;
  const totalSpend  = categorySpending.reduce((s,c) => s + c.amount, 0);
  const totalIncome = categoryIncome.reduce((s,c)   => s + c.amount, 0);
  const taskPieData = taskDist.filter(t => t.count > 0).map(t => ({
    name: TASK_LABELS[t.status], value: t.count, color: TASK_COLORS[t.status],
  }));

  return (
    <div className="an-page">

      {/* HEADER */}
      <div className="an-header">
        <div>
          <div className="an-title-row">
            <div className="an-title-icon"><LayoutDashboard size={20}/></div>
            <h1 className="an-title">Vue <em>Globale</em></h1>
          </div>
          <p className="an-sub">KPIs · Revenus · Catégories · Projets</p>
        </div>
        <YearSelect years={years} value={year} onChange={setYear}/>
      </div>

      {/* KPI STRIP */}
      <div className="an-kpis mb-22">
        <div className="an-kpi" data-c="green">
          <div className="an-kpi-l">Total Entrées {year}</div>
          <div className="an-kpi-v">{fmtK(kpis.totalIn)} DH</div>
        </div>
        <div className="an-kpi" data-c="red">
          <div className="an-kpi-l">Total Sorties {year}</div>
          <div className="an-kpi-v">{fmtK(kpis.totalOut)} DH</div>
        </div>
        <div className="an-kpi" data-c={marginPct >= 25 ? '' : 'red'}>
          <div className="an-kpi-l">Marge Nette</div>
          <div className="an-kpi-v">{fmtK(kpis.margin)} DH</div>
          <div className={`an-kpi-s ${marginPct >= 25 ? 'pos' : 'neg'}`}>{marginPct}% du CA</div>
        </div>
        <div className="an-kpi" data-c="amber">
          <div className="an-kpi-l">Projets Actifs</div>
          <div className="an-kpi-v">{kpis.activeCount}</div>
          <div className="an-kpi-s">{kpis.completedCount} terminés · {kpis.archivedCount} archivés</div>
        </div>
        <div className="an-kpi" data-c="purple">
          <div className="an-kpi-l">Meilleur Mois</div>
          <div className="an-kpi-v">{kpis.bestMonth}</div>
          <div className="an-kpi-s pos">Marge maximale</div>
        </div>
      </div>

      {/* ROW 1 — Area chart + task donut */}
      <div className="mb-16">
        <div className="an-card">
          <div className="an-card-hd">
            <div className="an-card-ttl"><Activity size={13}/> Revenus vs Dépenses — {year}</div>
          </div>
          <div className="an-card-body">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthly} margin={{ top:4, right:8, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="ovGRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16b870" stopOpacity={.25}/>
                    <stop offset="95%" stopColor="#16b870" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ovGDep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ee3f58" stopOpacity={.2}/>
                    <stop offset="95%" stopColor="#ee3f58" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--an-grid-line)"/>
                <XAxis dataKey="month" tick={{ fill:'var(--an-text-muted)', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={fmtK} tick={{ fill:'var(--an-text-muted)', fontSize:9 }} axisLine={false} tickLine={false} width={36}/>
                <Tooltip content={<AnTooltip/>}/>
                <Area type="monotone" dataKey="revenus"  name="Revenus"  stroke="#16b870" fill="url(#ovGRev)" strokeWidth={2}/>
                <Area type="monotone" dataKey="depenses" name="Dépenses" stroke="#ee3f58" fill="url(#ovGDep)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>


      </div>

      {/* ROW 2 — Category donuts */}
      <div className="g-2 mb-16">
        <div className="an-card">
          <div className="an-card-hd">
            <div className="an-card-ttl" style={{ color:'#ee3f58' }}><ArrowDownRight size={13}/> Où va l'Argent</div>
          </div>
          <div className="donut-wrap">
            <div className="donut-left">
              <ResponsiveContainer width={170} height={170}>
                <PieChart>
                  <Pie data={categorySpending} cx="50%" cy="50%" innerRadius={42} outerRadius={68}
                    dataKey="amount" paddingAngle={2} startAngle={90} endAngle={-270}>
                    {categorySpending.map((_,i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                  </Pie>
                  <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily:"'Familjen Grotesk',sans-serif", fontSize:12, fontWeight:700, fill:'var(--an-text)' }}>
                    {fmtK(totalSpend)}
                  </text>
                  <text x="50%" y="61%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize:9, fill:'var(--an-text-muted)' }}>DH total</text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="donut-right">
              <div className="cat-rows">
                {categorySpending.map((c,i) => (
                  <div key={c.name} className="cat-row">
                    <span className="cat-dot" style={{ background:PIE_COLORS[i % PIE_COLORS.length] }}/>
                    <span className="cat-name">{c.name}</span>
                    <div className="cat-bar-track"><div className="cat-bar-fill" style={{ width:`${c.pct}%`, background:PIE_COLORS[i % PIE_COLORS.length] }}/></div>
                    <span className="cat-pct" style={{ color:PIE_COLORS[i % PIE_COLORS.length] }}>{c.pct}%</span>
                    <span className="cat-amt">{fmtK(c.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="an-card">
          <div className="an-card-hd">
            <div className="an-card-ttl" style={{ color:'#16b870' }}><ArrowUpRight size={13}/> Sources de Revenus</div>
          </div>
          <div className="donut-wrap">
            <div className="donut-left">
              <ResponsiveContainer width={170} height={170}>
                <PieChart>
                  <Pie data={categoryIncome} cx="50%" cy="50%" innerRadius={42} outerRadius={68}
                    dataKey="amount" paddingAngle={2} startAngle={90} endAngle={-270}>
                    {categoryIncome.map((_,i) => <Cell key={i} fill={['#16b870','#14b8a6','#f0a81a','#4fa3ff'][i] || PIE_COLORS[i]}/>)}
                  </Pie>
                  <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily:"'Familjen Grotesk',sans-serif", fontSize:12, fontWeight:700, fill:'var(--an-text)' }}>
                    {fmtK(totalIncome)}
                  </text>
                  <text x="50%" y="61%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize:9, fill:'var(--an-text-muted)' }}>DH total</text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="donut-right">
              <div className="cat-rows">
                {categoryIncome.map((c,i) => {
                  const col = ['#16b870','#14b8a6','#f0a81a','#4fa3ff'][i] || PIE_COLORS[i];
                  return (
                    <div key={c.name} className="cat-row">
                      <span className="cat-dot" style={{ background:col }}/>
                      <span className="cat-name">{c.name}</span>
                      <div className="cat-bar-track"><div className="cat-bar-fill" style={{ width:`${c.pct}%`, background:col }}/></div>
                      <span className="cat-pct" style={{ color:col }}>{c.pct}%</span>
                      <span className="cat-amt">{fmtK(c.amount)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3 — Projects table */}
      <div className="an-card">
        <div className="an-card-hd">
          <div className="an-card-ttl"><FolderOpen size={13}/> Rentabilité des Projets</div>
        </div>
        <div style={{ padding:'0 0 8px' }}>
          <table className="an-table">
            <thead>
              <tr>
                <th style={{ paddingLeft:20 }}>Projet</th>
                <th>Client</th>
                <th>CA</th>
                <th>Dépensé</th>
                <th>Marge</th>
                <th>%</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {projectsTable.map(p => (
                <tr key={p._id}>
                  <td style={{ paddingLeft:20, fontWeight:700, color:'var(--an-text)' }}>{p.name}</td>
                  <td>{p.client}</td>
                  <td style={{ color:'#16b870', fontWeight:700 }}>{fmt(p.revenue)} DH</td>
                  <td style={{ color:'#ee3f58' }}>{fmt(p.spent)} DH</td>
                  <td style={{ color: p.margin >= 0 ? '#16b870' : '#ee3f58', fontWeight:700 }}>
                    {p.margin >= 0 ? '+' : ''}{fmt(p.margin)} DH
                  </td>
                  <td>
                    <span style={{ color: p.marginPct >= 30 ? '#16b870' : p.marginPct >= 15 ? '#f0a81a' : '#ee3f58', fontWeight:700, fontSize:12 }}>
                      {p.marginPct}%
                    </span>
                  </td>
                  <td><span className={`proj-status ${p.status}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {projectsTable.length === 0 && (
            <div style={{ color:'var(--an-text-muted)', fontSize:12, textAlign:'center', padding:'30px 0' }}>Aucun projet</div>
          )}
        </div>
      </div>

    </div>
  );
}