import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { TrendingUp, FolderOpen, Award, ArrowUpRight, ArrowDownRight, BarChart2, CalendarRange } from 'lucide-react';
import api from '../../services/api';
import './Analytics.css';

const fmt  = n => Number(n || 0).toLocaleString('fr-MA');
const fmtK = n => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n;

const AnTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="an-tooltip">
      <div className="an-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="an-tooltip-row" style={{ color: p.color || 'var(--an-text)' }}>
          <span>{p.name}</span>
          <span>
            {p.name === 'Projets' || p.name === 'Croissance'
              ? `${p.value}${p.name === 'Croissance' ? '%' : ''}`
              : `${fmt(p.value)} DH`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Yearly() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/yearly')
      .then(r => { setData(r.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="an-page"><div className="an-loader"><div className="an-loader-ring"/><span>Chargement...</span></div></div>
  );
  if (!data) return <div className="an-page" style={{ color:'var(--an-red)' }}>Erreur de chargement</div>;

  const { yearly } = data;
  const last4 = yearly.slice(-4);

  return (
    <div className="an-page">

      {/* HEADER */}
      <div className="an-header">
        <div>
          <div className="an-title-row">
            <div className="an-title-icon"><CalendarRange size={20}/></div>
            <h1 className="an-title">Comparaison <em>Annuelle</em></h1>
          </div>
          <p className="an-sub">Croissance · Rentabilité · Évolution</p>
        </div>
      </div>

      {/* KPI — last 4 years */}
      <div className="an-kpis mb-22" style={{ gridTemplateColumns:'repeat(4,1fr)' }}>
        {last4.map((y, i) => {
          const colors = ['', '', 'amber', 'green'];
          return (
            <div key={y.year} className="an-kpi" data-c={colors[i] || ''}>
              <div className="an-kpi-l">CA {y.year}</div>
              <div className="an-kpi-v">{fmtK(y.revenus)} DH</div>
              <div className={`an-kpi-s ${y.growth >= 0 ? 'pos' : 'neg'}`}>
                {y.growth >= 0 ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
                {Math.abs(y.growth)}% vs {parseInt(y.year) - 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* MAIN — 3 bars × all years */}
      <div className="an-card mb-16">
        <div className="an-card-hd">
          <div className="an-card-ttl"><BarChart2 size={13}/> CA / Dépenses / Marge — Toutes Années</div>
        </div>
        <div className="an-card-body">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={yearly} barGap={3} margin={{ top:4, right:8, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--an-grid-line)" vertical={false}/>
              <XAxis dataKey="year" tick={{ fill:'var(--an-text-muted)', fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fill:'var(--an-text-muted)', fontSize:9 }} axisLine={false} tickLine={false} width={38}/>
              <Tooltip content={<AnTooltip/>}/>
              <Bar dataKey="revenus"  name="Revenus"  fill="#16b870" radius={[5,5,0,0]} maxBarSize={32}/>
              <Bar dataKey="depenses" name="Dépenses" fill="#ee3f58" radius={[5,5,0,0]} maxBarSize={32}/>
              <Bar dataKey="marge"    name="Marge"    fill="#4fa3ff" radius={[5,5,0,0]} maxBarSize={32}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 2 — Growth + Projects */}
      <div className="g-2 mb-16">
        <div className="an-card">
          <div className="an-card-hd">
            <div className="an-card-ttl"><TrendingUp size={13}/> Croissance du CA (%)</div>
          </div>
          <div className="an-card-body">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={yearly} margin={{ top:4, right:8, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--an-grid-line)"/>
                <XAxis dataKey="year" tick={{ fill:'var(--an-text-muted)', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v => `${v}%`} tick={{ fill:'var(--an-text-muted)', fontSize:9 }} axisLine={false} tickLine={false} width={34}/>
                <Tooltip content={<AnTooltip/>}/>
                <Line type="monotone" dataKey="growth" name="Croissance" stroke="#f0a81a" strokeWidth={2.5}
                  dot={{ fill:'#f0a81a', r:5, strokeWidth:0 }} activeDot={{ r:7 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="an-card">
          <div className="an-card-hd">
            <div className="an-card-ttl"><FolderOpen size={13}/> Projets par Année</div>
          </div>
          <div className="an-card-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={yearly} margin={{ top:4, right:8, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--an-grid-line)" vertical={false}/>
                <XAxis dataKey="year" tick={{ fill:'var(--an-text-muted)', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'var(--an-text-muted)', fontSize:9 }} axisLine={false} tickLine={false} width={24}/>
                <Tooltip content={<AnTooltip/>}/>
                <Bar dataKey="projets" name="Projets" radius={[5,5,0,0]} maxBarSize={40}>
                  {yearly.map((_,i) => <Cell key={i} fill="#7c5cf4"/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

{/* SUMMARY TABLE */}
<div className="an-card">
  <div className="an-card-hd">
    <div className="an-card-ttl"><Award size={13}/> Résumé Annuel</div>
  </div>
  <div className="an-card-body" style={{ padding:'12px 0 4px' }}>
    <table className="yr-table">
      <thead>
        <tr>
          <th style={{ paddingLeft:20 }}>Année</th>
          <th>Revenus</th>
          <th>Croissance Revenus</th>
          <th>Dépenses</th>
          <th>Marge</th>
          <th>Croissance Marge</th>
          <th>Taux</th>
          <th>Projets</th>
        </tr>
      </thead>
      <tbody>
        {yearly.map(y => (
          <tr key={y.year}>
            <td style={{ paddingLeft:20 }}>
              <span className="yr-num">{y.year}</span>
            </td>
            <td style={{ color:'#16b870', fontWeight:700 }}>{fmtK(y.revenus)} DH</td>
            <td>
              {y.growth !== 0 ? (
                <span style={{ color: y.growth > 0 ? '#16b870' : '#ee3f58', fontWeight:700, display:'flex', alignItems:'center', gap:3, fontSize:12 }}>
                  {y.growth > 0 ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}
                  {Math.abs(y.growth)}%
                </span>
              ) : <span style={{ color:'var(--an-text-muted)' }}>—</span>}
            </td>
            <td style={{ color:'#ee3f58' }}>{fmtK(y.depenses)} DH</td>
            <td style={{ color:'#4fa3ff', fontWeight:700 }}>{fmtK(y.marge)} DH</td>
            <td>
              {y.margeGrowth !== 0 ? (
                <span style={{ color: y.margeGrowth > 0 ? '#16b870' : '#ee3f58', fontWeight:700, display:'flex', alignItems:'center', gap:3, fontSize:12 }}>
                  {y.margeGrowth > 0 ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}
                  {Math.abs(y.margeGrowth)}%
                </span>
              ) : <span style={{ color:'var(--an-text-muted)' }}>—</span>}
            </td>
            <td>
              <span style={{ color: y.tauxMarge >= 30 ? '#16b870' : y.tauxMarge >= 20 ? '#f0a81a' : '#ee3f58', fontWeight:700 }}>
                {y.tauxMarge}%
              </span>
            </td>
            <td style={{ fontWeight:700, color:'#7c5cf4' }}>{y.projets}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

    </div>
  );
}