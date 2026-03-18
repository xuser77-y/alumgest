import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  CalendarDays, TrendingUp, DollarSign, Target,
  ArrowDownRight, ArrowUpRight, Users, BarChart2,
} from 'lucide-react';
import api from '../../services/api';
import useAnalyticsYears from './useAnalyticsYears';
import './Analytics.css';

const PIE_COLORS = ['#1870e0','#16b870','#f0a81a','#7c5cf4','#ee3f58','#14b8a6','#4fa3ff','#a78bfa'];
const MONTHS     = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const fmt        = n => Number(n || 0).toLocaleString('fr-MA');
const fmtK       = n => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n;

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

export default function Monthly() {
  const { years }                   = useAnalyticsYears();
  const [year,     setYear]         = useState(String(new Date().getFullYear()));
  const [monthSel, setMonthSel]     = useState('all');
  const [data,     setData]         = useState(null);
  const [loading,  setLoading]      = useState(true);

  useEffect(() => {
    setLoading(true);
    setMonthSel('all'); // reset selection when year changes
    api.get(`/analytics/monthly?year=${year}`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [year]);

  /* ── DERIVED DATA based on selected month ── */
  const derived = useMemo(() => {
    if (!data) return null;
    const { monthly, cumulData, categorySpending, categoryIncome, totals } = data;

    // All-year aggregates (always from full data)
    const avgRev   = Math.round(monthly.reduce((s,m) => s + m.revenus, 0) / 12);
    const avgMarge = Math.round(monthly.reduce((s,m) => s + m.marge,   0) / 12);
    const avgPct   = avgRev > 0 ? Math.round((avgMarge / avgRev) * 100) : 0;
    const best     = [...monthly].sort((a,b) => b.marge - a.marge)[0];

    // Chart data — when a month is selected, only show that one bar
    const chartData = monthSel === 'all'
      ? monthly
      : monthly.map(m => ({
          ...m,
          revenus:  m.month === monthSel ? m.revenus  : 0,
          depenses: m.month === monthSel ? m.depenses : 0,
          marge:    m.month === monthSel ? m.marge    : 0,
          salaires: m.month === monthSel ? m.salaires : 0,
          _dim: m.month !== monthSel, // flag for custom color
        }));

    // Selected month detail
    const selMonth = monthSel !== 'all' ? monthly.find(m => m.month === monthSel) : null;

    return { monthly, cumulData, categorySpending, categoryIncome, totals, avgRev, avgMarge, avgPct, best, chartData, selMonth };
  }, [data, monthSel]);

  if (loading) return (
    <div className="an-page"><div className="an-loader"><div className="an-loader-ring"/><span>Chargement...</span></div></div>
  );
  if (!data || !derived) return <div className="an-page" style={{ color:'var(--an-red)' }}>Erreur de chargement</div>;

  const { monthly, cumulData, categorySpending, categoryIncome, totals, avgRev, avgMarge, avgPct, best, chartData, selMonth } = derived;

  return (
    <div className="an-page">

      {/* HEADER */}
      <div className="an-header">
        <div>
          <div className="an-title-row">
            <div className="an-title-icon"><CalendarDays size={20}/></div>
            <h1 className="an-title">Rapport <em>Mensuel</em></h1>
          </div>
          <p className="an-sub">Évolution · Salaires · Répartition des charges</p>
        </div>
        <select className="an-yr-sel" value={year} onChange={e => setYear(e.target.value)}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* MONTH PILLS */}
      <div className="month-pills">
        <button className={`month-pill${monthSel === 'all' ? ' active' : ''}`} onClick={() => setMonthSel('all')}>
          Annuel
        </button>
        {MONTHS.map(m => (
          <button key={m} className={`month-pill${monthSel === m ? ' active' : ''}`} onClick={() => setMonthSel(m)}>
            {m}
          </button>
        ))}
      </div>

      {/* SELECTED MONTH DETAIL STRIP */}
      {selMonth && (
        <div className="month-sel-strip">
          <span className="month-sel-label">{selMonth.month} {year}</span>
          <div className="month-sel-stat">
            <span className="month-sel-stat-l">Revenus</span>
            <span className="month-sel-stat-v" style={{ color:'#16b870' }}>{fmt(selMonth.revenus)} DH</span>
          </div>
          <div className="month-sel-stat">
            <span className="month-sel-stat-l">Dépenses</span>
            <span className="month-sel-stat-v" style={{ color:'#ee3f58' }}>{fmt(selMonth.depenses)} DH</span>
          </div>
          <div className="month-sel-stat">
            <span className="month-sel-stat-l">Marge</span>
            <span className="month-sel-stat-v" style={{ color: selMonth.marge >= 0 ? '#16b870' : '#ee3f58' }}>
              {selMonth.marge >= 0 ? '+' : ''}{fmt(selMonth.marge)} DH
            </span>
          </div>
          <div className="month-sel-stat">
            <span className="month-sel-stat-l">Salaires</span>
            <span className="month-sel-stat-v" style={{ color:'#f0a81a' }}>{fmt(selMonth.salaires)} DH</span>
          </div>
          <div className="month-sel-stat">
            <span className="month-sel-stat-l">Taux marge</span>
            <span className="month-sel-stat-v" style={{ color: selMonth.revenus > 0 ? '#4fa3ff' : 'var(--an-text-muted)' }}>
              {selMonth.revenus > 0 ? Math.round((selMonth.marge / selMonth.revenus) * 100) : 0}%
            </span>
          </div>
        </div>
      )}

      {/* INSIGHTS — always show yearly averages */}
      <div className="insight-grid">
        <div className="insight">
          <div className="insight-ico" style={{ background:'rgba(22,184,112,.14)' }}>
            <TrendingUp size={18} color="#16b870"/>
          </div>
          <div>
            <div className="insight-ttl">Meilleur Mois</div>
            <div className="insight-val">{best?.month} {year}</div>
            <div className="insight-sub">{fmtK(best?.marge)} DH de marge</div>
          </div>
        </div>
        <div className="insight">
          <div className="insight-ico" style={{ background:'rgba(24,112,224,.14)' }}>
            <DollarSign size={18} color="#4fa3ff"/>
          </div>
          <div>
            <div className="insight-ttl">Revenu Mensuel Moyen</div>
            <div className="insight-val">{fmtK(avgRev)} DH</div>
            <div className="insight-sub">Sur 12 mois</div>
          </div>
        </div>
        <div className="insight">
          <div className="insight-ico" style={{ background:'rgba(240,168,26,.12)' }}>
            <Target size={18} color="#f0a81a"/>
          </div>
          <div>
            <div className="insight-ttl">Marge Mensuelle Moy.</div>
            <div className="insight-val">{fmtK(avgMarge)} DH</div>
            <div className="insight-sub">~{avgPct}% du CA</div>
          </div>
        </div>
      </div>

      {/* MAIN BAR — uses chartData which is filtered when month selected */}
      <div className="an-card mb-16">
        <div className="an-card-hd">
          <div className="an-card-ttl">
            <BarChart2 size={13}/>
            {monthSel === 'all' ? `Revenus / Dépenses / Marge — ${year}` : `Détail — ${monthSel} ${year}`}
          </div>
        </div>
        <div className="an-card-body">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top:4, right:8, left:0, bottom:0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--an-grid-line)" vertical={false}/>
              <XAxis dataKey="month" tick={{ fill:'var(--an-text-muted)', fontSize:10 }} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={fmtK} tick={{ fill:'var(--an-text-muted)', fontSize:9 }} axisLine={false} tickLine={false} width={36}/>
              <Tooltip content={<AnTooltip/>}/>
              <Bar dataKey="revenus"  name="Revenus"  fill="#16b870" radius={[4,4,0,0]} maxBarSize={22}
                fillOpacity={monthSel === 'all' ? 1 : undefined}>
                {monthSel !== 'all' && chartData.map((d,i) => (
                  <Cell key={i} fill="#16b870" fillOpacity={d._dim ? 0.15 : 1}/>
                ))}
              </Bar>
              <Bar dataKey="depenses" name="Dépenses" fill="#ee3f58" radius={[4,4,0,0]} maxBarSize={22}>
                {monthSel !== 'all' && chartData.map((d,i) => (
                  <Cell key={i} fill="#ee3f58" fillOpacity={d._dim ? 0.15 : 1}/>
                ))}
              </Bar>
              <Bar dataKey="marge"    name="Marge"    fill="#4fa3ff" radius={[4,4,0,0]} maxBarSize={22}>
                {monthSel !== 'all' && chartData.map((d,i) => (
                  <Cell key={i} fill="#4fa3ff" fillOpacity={d._dim ? 0.15 : 1}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 2 — Cumulative + Salaires */}
      <div className="g-2 mb-16">
        <div className="an-card">
          <div className="an-card-hd">
            <div className="an-card-ttl"><TrendingUp size={13}/> CA Cumulé {year}</div>
          </div>
          <div className="an-card-body">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cumulData} margin={{ top:4, right:8, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="mnGCumul" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c5cf4" stopOpacity={.3}/>
                    <stop offset="95%" stopColor="#7c5cf4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--an-grid-line)"/>
                <XAxis dataKey="month" tick={{ fill:'var(--an-text-muted)', fontSize:9 }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fill:'var(--an-text-muted)', fontSize:9 }} axisLine={false} tickLine={false} width={36}/>
                <Tooltip content={<AnTooltip/>}/>
                <Area type="monotone" dataKey="cumul" name="CA Cumulé" stroke="#7c5cf4" fill="url(#mnGCumul)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="an-card">
          <div className="an-card-hd">
            <div className="an-card-ttl"><Users size={13}/> Masse Salariale Mensuelle</div>
          </div>
          <div className="an-card-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthSel === 'all' ? monthly : chartData} margin={{ top:4, right:8, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--an-grid-line)" vertical={false}/>
                <XAxis dataKey="month" tick={{ fill:'var(--an-text-muted)', fontSize:9 }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={fmtK} tick={{ fill:'var(--an-text-muted)', fontSize:9 }} axisLine={false} tickLine={false} width={36}/>
                <Tooltip content={<AnTooltip/>}/>
                <Bar dataKey="salaires" name="Salaires" fill="#f0a81a" radius={[4,4,0,0]} maxBarSize={20}>
                  {monthSel !== 'all' && chartData.map((d,i) => (
                    <Cell key={i} fill="#f0a81a" fillOpacity={d._dim ? 0.15 : 1}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 3 — Category donuts */}
      <div className="g-2">
        <div className="an-card">
          <div className="an-card-hd">
            <div className="an-card-ttl" style={{ color:'#ee3f58' }}><ArrowDownRight size={13}/> Répartition des Charges</div>
          </div>
          <div className="donut-wrap">
            <div className="donut-left">
              <ResponsiveContainer width={170} height={170}>
                <PieChart>
                  <Pie data={categorySpending} cx="50%" cy="50%" innerRadius={44} outerRadius={70}
                    dataKey="amount" paddingAngle={2} startAngle={90} endAngle={-270}>
                    {categorySpending.map((_,i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                  </Pie>
                  <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily:"'Familjen Grotesk',sans-serif", fontSize:12, fontWeight:700, fill:'var(--an-text)' }}>
                    {fmtK(totals.totalSpend)}
                  </text>
                  <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize:9, fill:'var(--an-text-muted)' }}>DH</text>
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
                  <Pie data={categoryIncome} cx="50%" cy="50%" innerRadius={44} outerRadius={70}
                    dataKey="amount" paddingAngle={2} startAngle={90} endAngle={-270}>
                    {categoryIncome.map((_,i) => <Cell key={i} fill={['#16b870','#14b8a6','#f0a81a','#4fa3ff'][i] || PIE_COLORS[i]}/>)}
                  </Pie>
                  <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily:"'Familjen Grotesk',sans-serif", fontSize:12, fontWeight:700, fill:'var(--an-text)' }}>
                    {fmtK(totals.totalIncome)}
                  </text>
                  <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize:9, fill:'var(--an-text-muted)' }}>DH</text>
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

    </div>
  );
}