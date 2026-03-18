import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import {
  Wallet, FolderKanban, Users, AlertCircle, TrendingUp,
  ArrowRight, ArrowUpRight, ArrowDownRight, Activity,
  CheckCircle2, Clock, Package, ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import './Dashboard.css';

/* ─── helpers ─── */
const fmt  = n => Number(n || 0).toLocaleString('fr-MA');
const fmtK = n => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n ?? 0);

/* ─── debt card dynamic background ─────────────────────────
   0  – 30 000 DH  → green
   30 001 – 60 000 → yellow/amber
   60 001 – 100 000→ red
   > 100 000       → purple
──────────────────────────────────────────────────────────── */
const debtCardBg = (debt) => {
  if (debt <= 30000)  return 'linear-gradient(135deg,#0d7a4e,#16b870)';
  if (debt <= 60000)  return 'linear-gradient(135deg,#92610a,#e8aa20)';
  if (debt <= 100000) return 'linear-gradient(135deg,#8b1a2a,#ee3f58)';
  return                     'linear-gradient(135deg,#3b1f8c,#7c5cf4)';
};

/* ─── tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="dash-tooltip-row" style={{ color: p.color }}>
          <span>{p.name}</span>
          <span className="fw-bold">{fmt(p.value)} DH</span>
        </div>
      ))}
    </div>
  );
};

/* ─── status badge ─── */
const StatusBadge = ({ status }) => {
  const map = {
    active:    ['En cours', 'badge-active'],
    completed: ['Terminé',  'badge-done'],
    archived:  ['Archivé',  'badge-archived'],
  };
  const [label, cls] = map[status] || ['—', 'badge-archived'];
  return <span className={`dash-badge ${cls}`}>{label}</span>;
};

const CAT_COLORS = ['#ee3f58','#f0a81a','#7c5cf4','#4fa3ff','#14b8a6'];

/* ═══════════════════════════════════════ */
const Dashboard = () => {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(res => { setData(res.data); setTimeout(() => setVisible(true), 80); })
      .catch(err => console.error('Dash Error:', err));
  }, []);

  if (!data) return (
    <div className="vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <div className="dash-spinner mb-3" />
        <div className="jakan-title text-muted" style={{ fontSize: 14, letterSpacing: 2 }}>
          CHARGEMENT DU CENTRE DE CONTRÔLE...
        </div>
      </div>
    </div>
  );

  const { kpis, monthlyTrend = [], categorySpending = [], recentProjects = [] } = data;
  const marginPct    = kpis.totalIn > 0 ? Math.round((kpis.cashInPocket / kpis.totalIn) * 100) : 0;
  const recoveryRate = kpis.recoveryRate || 0;

  const donutData = [
    { name: 'Encaissé',       value: kpis.cashInPocket },
    { name: 'Dette Restante', value: kpis.clientDebt   },
  ];

  return (
    <Container fluid className={`py-4 dash-page ${visible ? 'dash-visible' : ''}`}>

      {/* ══ HEADER ══ */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="jakan-title text-title mb-1">
            TABLEAU DE <em style={{ color: 'var(--jakan-blue)', fontStyle: 'normal' }}>BORD</em>
          </h1>
          <p className="text-muted small mb-0 uppercase letter-spacing-2">
            Gil Jakan Aluminium · État du jour
          </p>
        </div>
        <div className="dash-live-badge">
          <div className="dash-live-dot" />
          <span>Données en direct</span>
        </div>
      </div>

      {/* ══ KPI ROW ══ */}
      <Row className="g-3 mb-4">

        <Col md={6} lg={3}>
          <div className="dash-kpi-card shadow-sm" style={{ '--accent': '#1db87a' }}>
            <div className="dash-kpi-top">
              <div className="icon-box" style={{ background: 'rgba(29,184,122,.12)', color: '#1db87a' }}>
                <Wallet size={20} />
              </div>
              <span className="dash-kpi-trend trend-up">
                <ArrowUpRight size={12}/>{marginPct}%
              </span>
            </div>
            <div className="small text-muted fw-bold mb-1 letter-spacing-2">CASH EN CAISSE</div>
            <div className="val">{fmt(kpis.cashInPocket)} <span className="val-unit">DH</span></div>
            <div className="dash-kpi-sub">Revenus − Dépenses cumulés</div>
            <div className="dash-kpi-bar" style={{ '--bw': `${Math.min(marginPct,100)}%`, '--bc': '#1db87a' }} />
          </div>
        </Col>

        <Col md={6} lg={3}>
          <div className="dash-kpi-card shadow-sm" style={{ '--accent': 'var(--jakan-blue)' }}>
            <div className="dash-kpi-top">
              <div className="icon-box" style={{ background: 'rgba(0,97,242,.10)', color: 'var(--jakan-blue)' }}>
                <FolderKanban size={20} />
              </div>
              <span className="dash-kpi-trend trend-up">
                <ArrowUpRight size={12}/>{kpis.completedProjects} terminés
              </span>
            </div>
            <div className="small text-muted fw-bold mb-1 letter-spacing-2">PROJETS ACTIFS</div>
            <div className="val">{kpis.activeProjects}</div>
            <div className="dash-kpi-sub">En production actuellement</div>
            <div className="dash-kpi-bar" style={{ '--bw': '65%', '--bc': 'var(--jakan-blue)' }} />
          </div>
        </Col>

        {/* ── DETTE CLIENTS — dynamic gradient based on amount ── */}
        <Col md={6} lg={3}>
          <div
            className="dash-kpi-card debt-card shadow-lg"
            style={{ background: debtCardBg(kpis.clientDebt || 0) }}
          >
            <div className="dash-kpi-top">
              <div className="icon-box" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>
                <AlertCircle size={20} />
              </div>
              <span className="dash-kpi-trend" style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}>
                <ArrowDownRight size={12}/>{recoveryRate}% rec.
              </span>
            </div>
            <div className="small fw-bold mb-1 letter-spacing-2" style={{ color: 'rgba(255,255,255,.7)' }}>
              DETTE CLIENTS
            </div>
            <div className="val">{fmt(kpis.clientDebt)} <span className="val-unit">DH</span></div>
            <div className="dash-kpi-sub" style={{ color: 'rgba(255,255,255,.6)' }}>À recouvrer sur chantiers</div>
            <div className="dash-kpi-bar" style={{ '--bw': `${recoveryRate}%`, '--bc': 'rgba(255,255,255,.55)' }} />
          </div>
        </Col>

        <Col md={6} lg={3}>
          <div className="dash-kpi-card shadow-sm" style={{ '--accent': '#f0a81a' }}>
            <div className="dash-kpi-top">
              <div className="icon-box" style={{ background: 'rgba(240,168,26,.12)', color: '#f0a81a' }}>
                <Users size={20} />
              </div>
              <span className="dash-kpi-trend trend-up">
                <ArrowUpRight size={12}/>Équipe
              </span>
            </div>
            <div className="small text-muted fw-bold mb-1 letter-spacing-2">EFFECTIF ATELIER</div>
            <div className="val">{kpis.totalWorkers}</div>
            <div className="dash-kpi-sub">Ouvriers actifs</div>
            <div className="dash-kpi-bar" style={{ '--bw': '80%', '--bc': '#f0a81a' }} />
          </div>
        </Col>
      </Row>

      {/* ══ ROW 2: Area chart + Donut ══ */}
      <Row className="g-3 mb-4">
        <Col lg={8}>
          <Card className="an-card border-0 shadow-sm h-100">
            <div className="an-card-hd d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <div className="an-card-icon" style={{ background: 'rgba(29,184,122,.12)', color: '#1db87a' }}>
                  <TrendingUp size={15}/>
                </div>
                <span>FLUX DE TRÉSORERIE — 6 MOIS</span>
              </div>
              <div className="d-flex gap-3" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {[['#1db87a','Revenus'],['#ee3f58','Dépenses'],['#4fa3ff','Marge']].map(([c,l]) => (
                  <span key={l} className="d-flex align-items-center gap-1">
                    <span style={{ width:8,height:8,borderRadius:'50%',background:c,display:'inline-block'}}/>
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-3 pt-0">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyTrend} margin={{ top:10, right:10, left:-15, bottom:0 }}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1db87a" stopOpacity={0.22}/>
                      <stop offset="95%" stopColor="#1db87a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gMarge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4fa3ff" stopOpacity={0.18}/>
                      <stop offset="95%" stopColor="#4fa3ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,.04)"/>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill:'#607a94', fontSize:12 }}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fill:'#607a94', fontSize:11 }} tickFormatter={fmtK}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Area type="monotone" dataKey="revenus"  name="Revenus"  stroke="#1db87a" strokeWidth={2.5} fill="url(#gRev)"/>
                  <Area type="monotone" dataKey="depenses" name="Dépenses" stroke="#ee3f58" strokeWidth={2} fill="transparent" strokeDasharray="5 5"/>
                  <Area type="monotone" dataKey="marge"    name="Marge"    stroke="#4fa3ff" strokeWidth={2} fill="url(#gMarge)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="an-card border-0 shadow-sm h-100">
            <div className="an-card-hd">
              <div className="d-flex align-items-center gap-2">
                <div className="an-card-icon" style={{ background:'rgba(238,63,88,.12)', color:'#ee3f58' }}>
                  <Wallet size={15}/>
                </div>
                <span>RECOUVREMENT CLIENTS</span>
              </div>
            </div>
            <div className="px-3 pb-3 d-flex flex-column align-items-center">
              <div className="dash-donut-wrap">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={donutData} innerRadius={62} outerRadius={88}
                         dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                      <Cell fill="#1db87a"/>
                      <Cell fill="#ee3f58"/>
                    </Pie>
                    <Tooltip formatter={v => `${fmt(v)} DH`}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="dash-donut-center">
                  <div className="dash-donut-pct" style={{ color: recoveryRate>=50?'#1db87a':'#ee3f58' }}>
                    {recoveryRate}%
                  </div>
                  <div className="dash-donut-sub">récupéré</div>
                </div>
              </div>
              <div className="w-100 mt-2">
                {donutData.map((d,i) => (
                  <div key={i} className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ width:8,height:8,borderRadius:'50%',background:['#1db87a','#ee3f58'][i],display:'inline-block'}}/>
                      <span style={{ fontSize:12, color:'var(--text-muted)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize:12.5, fontWeight:700, color:['#1db87a','#ee3f58'][i] }}>
                      {fmt(d.value)} DH
                    </span>
                  </div>
                ))}
                <div className="dash-recovery-bar mt-2">
                  <div className="dash-recovery-fill" style={{ width:`${recoveryRate}%` }}/>
                </div>
                <div className="text-center mt-2" style={{ fontSize:11, color:'var(--text-muted)' }}>
                  Taux de recouvrement :{' '}
                  <strong style={{ color: recoveryRate>=50?'#1db87a':'#ee3f58' }}>{recoveryRate}%</strong>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ══ DÉPENSES PAR CATÉGORIE — full width ══ */}
      <Row className="g-3 mb-4">
        <Col>
          <Card className="an-card border-0 shadow-sm">
            <div className="an-card-hd">
              <div className="d-flex align-items-center gap-2">
                <div className="an-card-icon" style={{ background:'rgba(238,63,88,.12)', color:'#ee3f58' }}>
                  <Activity size={15}/>
                </div>
                <span>DÉPENSES PAR CATÉGORIE</span>
              </div>
            </div>
            <div className="px-3 pb-3">
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={categorySpending} layout="vertical"
                          margin={{ top:0, right:10, left:0, bottom:0 }} barSize={10}>
                  <CartesianGrid strokeDasharray="0" horizontal={false} stroke="rgba(255,255,255,.04)"/>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill:'#607a94', fontSize:10 }} tickFormatter={fmtK}/>
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                         tick={{ fill:'#a8c4de', fontSize:11 }} width={140}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="amount" name="Dépenses" radius={[0,4,4,0]}>
                    {categorySpending.map((_,i) => (
                      <Cell key={i} fill={CAT_COLORS[i%5]} fillOpacity={0.85}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ══ PROJECTS TABLE ══ */}
      <Card className="an-card border-0 shadow-sm mb-4">
        <div className="an-card-hd">
          <div className="d-flex align-items-center gap-2">
            <div className="an-card-icon" style={{ background:'rgba(0,97,242,.10)', color:'var(--jakan-blue)' }}>
              <FolderKanban size={15}/>
            </div>
            <span>DERNIÈRES ACTIVITÉS CHANTIERS</span>
          </div>
          <button className="dash-see-all" onClick={() => navigate('/projects/active')}>
            Voir tous <ChevronRight size={13}/>
          </button>
        </div>
        <div className="table-responsive">
          <table className="an-table w-100">
            <thead>
              <tr>
                <th>CHANTIER</th>
                <th>CLIENT</th>
                <th>BUDGET</th>
                <th>MARGE NETTE</th>
                <th>RENTABILITÉ</th>
                <th>STATUT</th>
                <th className="text-end">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {recentProjects.length === 0
                ? <tr><td colSpan={7} className="text-center py-4 text-muted small">Aucun projet récent.</td></tr>
                : recentProjects.map(p => {
                    const bc = p.marginPct>=30?'#1db87a':p.marginPct>=10?'#f0a81a':'#ee3f58';
                    return (
                      <tr key={p._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="dash-proj-dot" style={{ background:bc }}/>
                            <span className="fw-bold" style={{ color:'var(--text-title)', fontSize:13 }}>
                              {p.projectName}
                            </span>
                          </div>
                        </td>
                        <td style={{ color:'var(--text-muted)', fontSize:12.5 }}>{p.client?.name||'—'}</td>
                        <td style={{ color:'var(--jakan-blue)', fontWeight:700, fontSize:13 }}>
                          {fmt(p.totalPrice)} DH
                        </td>
                        <td style={{ color:bc, fontWeight:700, fontSize:13 }}>{fmt(p.margin)} DH</td>
                        <td style={{ width:200 }}>
                          <div className="d-flex align-items-center gap-2">
                            <div className="dash-proj-bar-wrap">
                              <div className="dash-proj-bar-fill"
                                   style={{ width:`${Math.max(0,Math.min(p.marginPct,100))}%`, background:bc }}/>
                            </div>
                            <span style={{ fontSize:12, fontWeight:700, color:bc, minWidth:32 }}>
                              {p.marginPct}%
                            </span>
                          </div>
                        </td>
                        <td><StatusBadge status={p.status}/></td>
                        <td className="text-end">
                          <button className="dash-action-btn"
                                  onClick={() => navigate(`/projects/details/${p._id}`)}>
                            <ArrowRight size={15}/>
                          </button>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      </Card>

      {/* ══ BOTTOM STAT PILLS ══ */}
      <Row className="g-3">
        {[
          { icon:<CheckCircle2 size={16}/>, color:'#1db87a', label:'Projets terminés',  val: kpis.completedProjects },
          { icon:<Clock        size={16}/>, color:'#f0a81a', label:'En cours',           val: kpis.activeProjects    },
          { icon:<Package      size={16}/>, color:'#4fa3ff', label:'CA total',           val: `${fmtK(kpis.totalIn)} DH` },
          { icon:<Users        size={16}/>, color:'#14b8a6', label:'Ouvriers',           val: kpis.totalWorkers },
          { icon:<AlertCircle  size={16}/>, color:'#ee3f58', label:'Dette restante',     val: `${fmtK(kpis.clientDebt)} DH` },
        ].map((s,i) => (
          <Col key={i} xs={6} md={4} lg={2}>
            <div className="dash-stat-pill shadow-sm">
              <div className="dash-stat-icon" style={{ background:`${s.color}18`, color:s.color }}>
                {s.icon}
              </div>
              <div className="dash-stat-val">{s.val}</div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          </Col>
        ))}
      </Row>

    </Container>
  );
};

export default Dashboard;