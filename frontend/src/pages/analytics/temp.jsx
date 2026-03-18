import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,CartesianGrid
} from 'recharts';
import { Users, CalendarDays, DollarSign, Award, Zap, ArrowUpRight, HardHat } from 'lucide-react';
import api from '../../services/api';
import useAnalyticsYears from './useAnalyticsYears';
import './Analytics.css';

const WORKER_COLORS = ['#f0a81a','#4fa3ff','#16b870','#14b8a6','#7c5cf4','#ee3f58','#a78bfa'];
const fmt  = n => Number(n || 0).toLocaleString('fr-MA');
const fmtK = n => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n;

const scoreColor = s => s >= 80 ? '#16b870' : s >= 60 ? '#f0a81a' : '#ee3f58';

const AnTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="an-tooltip">
      <div className="an-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="an-tooltip-row" style={{ color: p.color || 'var(--an-text)' }}>
          <span>{p.name}</span>
          <span>{p.dataKey === 'salary' ? `${fmt(p.value)} DH` : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function WorkerPerformance() {
  const { years }                 = useAnalyticsYears();
  const [year,    setYear]        = useState(String(new Date().getFullYear()));
  const [data,    setData]        = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics/workers?year=${year}`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [year]);

  if (loading) return (
    <div className="an-page"><div className="an-loader"><div className="an-loader-ring"/><span>Chargement...</span></div></div>
  );
  if (!data) return <div className="an-page" style={{ color:'var(--an-red)' }}>Erreur de chargement</div>;

  const { workers, teamKpis } = data;
  if (!workers?.length) return (
    <div className="an-page">
      <div style={{ color:'var(--an-text-muted)', textAlign:'center', padding:'80px 0', fontSize:14 }}>
        Aucun ouvrier trouvé
      </div>
    </div>
  );

  /* attendance chart — months × workers */
  const attChartData = workers[0]?.monthlyAtt?.map((ma, i) => {
    const row = { month: ma.month };
    workers.forEach(w => { row[w.name.split(' ')[0]] = w.monthlyAtt[i]?.days || 0; });
    return row;
  }) || [];

  /* radar */
  const radarData = [
    { metric:'Présence',    ...Object.fromEntries(workers.map(w => [w.name.split(' ')[0], Math.min(100, Math.round(w.fullDays / 250 * 100))])) },
    { metric:'Régularité',  ...Object.fromEntries(workers.map(w => [w.name.split(' ')[0], Math.max(0, Math.round((1 - w.absentDays / 365) * 100))])) },
    { metric:'Déplacements',...Object.fromEntries(workers.map(w => [w.name.split(' ')[0], Math.min(100, Math.round(w.displacements / 20 * 100))])) },
    { metric:'Score',       ...Object.fromEntries(workers.map(w => [w.name.split(' ')[0], w.score])) },
  ];

  /* horizontal salary */
  const salaryData = [...workers].sort((a,b) => b.salary - a.salary);

  return (
    <div className="an-page">

      {/* HEADER */}
      <div className="an-header">
        <div>
          <div className="an-title-row">
            <div className="an-title-icon"><HardHat size={20}/></div>
            <h1 className="an-title">Performance <em>Équipe</em></h1>
          </div>
          <p className="an-sub">Présence · Salaires · Radar</p>
        </div>
        <select className="an-yr-sel" value={year} onChange={e => setYear(e.target.value)}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* TEAM KPIs */}
      <div className="an-kpis mb-22" style={{ gridTemplateColumns:'repeat(4,1fr)' }}>
        <div className="an-kpi" data-c="green">
          <div className="an-kpi-l">Meilleur Ouvrier</div>
          <div className="an-kpi-v" style={{ fontSize:16 }}>{workers[0]?.name?.split(' ')[0] || '—'}</div>
          <div className="an-kpi-s pos"><ArrowUpRight size={10}/> Score {workers[0]?.score || 0}/100</div>
        </div>
        <div className="an-kpi" data-c="amber">
          <div className="an-kpi-l">Présence Moy. / An</div>
          <div className="an-kpi-v">{teamKpis.avgAttendance}j</div>
          <div className="an-kpi-s">jours travaillés</div>
        </div>
        <div className="an-kpi" data-c="red">
          <div className="an-kpi-l">Absences Totales</div>
          <div className="an-kpi-v">{teamKpis.totalAbsences}</div>
          <div className="an-kpi-s neg">jours cette année</div>
        </div>
        <div className="an-kpi" data-c="purple">
          <div className="an-kpi-l">Masse Salariale</div>
          <div className="an-kpi-v">{fmtK(teamKpis.totalSalary)} DH</div>
          <div className="an-kpi-s">cette année</div>
        </div>
      </div>

      {/* WORKER CARDS */}
      <div className="wk-grid">
        {workers.map((w, i) => {
          const col      = WORKER_COLORS[i % WORKER_COLORS.length];
          const initials = w.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
          return (
            <div key={w._id} className="wk-card">
              <div className="wk-card-top" style={{ background: col }}/>
              <div className="wk-rank" style={{ color: col }}>#{i + 1}</div>
              <div className="wk-avatar" style={{ background:`${col}1a`, color: col }}>{initials}</div>
              <div className="wk-name">{w.name}</div>
              <div className="wk-poste">{w.poste}</div>
              <div className="wk-stats">
                <div className="wk-stat">
                  <div className="wk-stat-l">Jours Pleins</div>
                  <div className="wk-stat-v" style={{ color:'#16b870' }}>{w.fullDays}</div>
                </div>
                <div className="wk-stat">
                  <div className="wk-stat-l">Absences</div>
                  <div className="wk-stat-v" style={{ color: w.absentDays > 10 ? '#ee3f58' : '#f0a81a' }}>{w.absentDays}</div>
                </div>
                <div className="wk-stat">
                  <div className="wk-stat-l">Déplacements</div>
                  <div className="wk-stat-v" style={{ color:'#4fa3ff' }}>{w.displacements}</div>
                </div>
              </div>
              {/* Salary */}
              <div style={{
                background:'var(--an-bg-stat)', borderRadius:8, padding:'8px 10px',
                display:'flex', justifyContent:'space-between', alignItems:'center',
                marginBottom:12, border:'1px solid var(--an-border)',
              }}>
                <span style={{ fontSize:8.5, letterSpacing:1.5, textTransform:'uppercase', color:'var(--an-text-muted)', fontWeight:700 }}>Salaire année</span>
                <span style={{ fontFamily:"'Familjen Grotesk',sans-serif", fontSize:15, fontWeight:700, color:'#f0a81a' }}>
                  {fmtK(w.salary)} DH
                </span>
              </div>
              {/* Score */}
              <div className="wk-score-lbl">
                <span>Score Performance</span>
                <span style={{ color: scoreColor(w.score), fontWeight:700 }}>{w.score}/100</span>
              </div>
              <div className="wk-score-track">
                <div className="wk-score-fill" style={{ width:`${w.score}%`, background: scoreColor(w.score) }}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* ATTENDANCE MONTHLY BAR */}
      {attChartData.length > 0 && (
        <div className="an-card mb-16">
          <div className="an-card-hd">
            <div className="an-card-ttl"><CalendarDays size={13}/> Présence Mensuelle par Ouvrier — {year}</div>
          </div>
          <div className="an-card-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={attChartData} margin={{ top:4, right:8, left:0, bottom:0 }} barGap={1}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--an-grid-line)" vertical={false}/>
                <XAxis dataKey="month" tick={{ fill:'var(--an-text-muted)', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis domain={[0,26]} tick={{ fill:'var(--an-text-muted)', fontSize:9 }} axisLine={false} tickLine={false} width={24}/>
                <Tooltip contentStyle={{ background:'var(--an-tooltip-bg)', border:'1px solid var(--an-tooltip-bd)', borderRadius:8, fontSize:11 }}/>
                {workers.map((w, i) => (
                  <Bar key={w._id} dataKey={w.name.split(' ')[0]} fill={WORKER_COLORS[i % WORKER_COLORS.length]}
                    radius={[3,3,0,0]} maxBarSize={12}/>
                ))}
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', gap:'6px 18px', flexWrap:'wrap', marginTop:10 }}>
              {workers.map((w,i) => (
                <div key={w._id} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10.5 }}>
                  <span style={{ width:8, height:8, borderRadius:2, background:WORKER_COLORS[i % WORKER_COLORS.length], display:'inline-block' }}/>
                  <span style={{ color:'var(--an-text-dim)' }}>{w.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RADAR + SALARY */}
      <div className="g-2">
        <div className="an-card">
          <div className="an-card-hd">
            <div className="an-card-ttl"><Zap size={13}/> Radar Performance</div>
          </div>
          <div className="an-card-body">
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--an-border)"/>
                <PolarAngleAxis dataKey="metric" tick={{ fill:'var(--an-text-dim)', fontSize:10 }}/>
                {workers.map((w, i) => (
                  <Radar key={w._id} name={w.name.split(' ')[0]}
                    dataKey={w.name.split(' ')[0]}
                    stroke={WORKER_COLORS[i % WORKER_COLORS.length]}
                    fill={WORKER_COLORS[i % WORKER_COLORS.length]}
                    fillOpacity={0.08} strokeWidth={1.5}/>
                ))}
                <Tooltip contentStyle={{ background:'var(--an-tooltip-bg)', border:'1px solid var(--an-tooltip-bd)', borderRadius:8, fontSize:11 }}/>
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', gap:'5px 16px', flexWrap:'wrap', marginTop:6 }}>
              {workers.map((w,i) => (
                <div key={w._id} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10.5 }}>
                  <span style={{ width:7, height:7, borderRadius:50, background:WORKER_COLORS[i % WORKER_COLORS.length], display:'inline-block' }}/>
                  <span style={{ color:'var(--an-text-dim)' }}>{w.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="an-card">
          <div className="an-card-hd">
            <div className="an-card-ttl"><DollarSign size={13}/> Salaires — {year}</div>
          </div>
          <div className="an-card-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salaryData} layout="vertical" margin={{ top:0, right:12, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--an-grid-line)" horizontal={false}/>
                <XAxis type="number" tickFormatter={fmtK} tick={{ fill:'var(--an-text-muted)', fontSize:9 }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" width={72}
                  tickFormatter={n => n.split(' ')[0]}
                  tick={{ fill:'var(--an-text-dim)', fontSize:10 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<AnTooltip/>}/>
                <Bar dataKey="salary" name="Salaire" radius={[0,5,5,0]} maxBarSize={22}>
                  {salaryData.map((_,i) => <Cell key={i} fill={WORKER_COLORS[i % WORKER_COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{
              marginTop:14, padding:'10px 14px', background:'var(--an-bg-stat)',
              borderRadius:8, border:'1px solid var(--an-border)',
              display:'flex', justifyContent:'space-between', alignItems:'center'
            }}>
              <span style={{ fontSize:10, color:'var(--an-text-muted)', fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>
                Total Masse Salariale
              </span>
              <span style={{ fontFamily:"'Familjen Grotesk',sans-serif", fontSize:20, fontWeight:700, color:'#f0a81a' }}>
                {fmt(teamKpis.totalSalary)} DH
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
