import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Table, Nav, Form } from 'react-bootstrap';
import { 
  ArrowLeft, Phone, Calendar, Briefcase,
  TrendingUp, Wallet, CheckCircle, Clock, AlertCircle 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';
import './WorkerProfile.css';

const WorkerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear,  setSelectedYear]  = useState(String(new Date().getFullYear()));
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [years,         setYears]         = useState([String(new Date().getFullYear())]);

  const loadProfile = async () => {
    try {
      const [resProfile, resHistory, resYears] = await Promise.all([
        api.get(`/workers/profile/${id}?year=${selectedYear}&month=${selectedMonth}`),
        api.get(`/payroll/history/${id}`),
        api.get('/payroll/years'),
      ]);
      setData(resProfile.data);
      setSalaryHistory(resHistory.data);
      if (resYears.data?.length) setYears(resYears.data);
    } catch (err) { console.error(err); }
  };

  const chartData = salaryHistory.map(p => ({
    name: `Mois ${p.month}`,
    "Salaire Net": p.netAmount,
    "Acomptes": p.advances
  }));

  useEffect(() => { loadProfile(); }, [id, selectedMonth, selectedYear]);

  if (!data) return <div className="p-5 text-center text-muted">Chargement du dossier...</div>;

  const { worker, attendance, transactions, disciplineScore } = data;

  const statsData = [
    { name: 'Plein',  value: attendance.filter(a => a.status === 'full').length,   color: '#22c55e' },
    { name: 'Demi',   value: attendance.filter(a => a.status === 'half').length,   color: '#eab308' },
    { name: 'Absent', value: attendance.filter(a => a.status === 'absent').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <Container fluid className="py-4">
      <Button variant="link" onClick={() => navigate(-1)} className="text-jakan p-0 mb-4 text-decoration-none fw-bold">
        <ArrowLeft size={20} className="me-2"/> RETOUR À LA LISTE
      </Button>

      {/* ① IDENTITY HEADER */}
      <div className="dossier-header mb-4 shadow-sm">
        <div className="avatar-big">{worker.name[0]}</div>
        <div className="flex-grow-1">
          <h1 className="jakan-title mb-1" style={{ fontSize: '2.8rem' }}>{worker.name}</h1>
          <div className="d-flex gap-3 mt-2 flex-wrap">
            <span className="text-muted small d-flex align-items-center"><Briefcase size={14} className="me-1"/> {worker.poste}</span>
            <span className="text-muted small d-flex align-items-center"><Phone size={14} className="me-1"/> {worker.phone}</span>
            <span className="text-muted small d-flex align-items-center"><Calendar size={14} className="me-1"/> Embauché: {new Date(worker.dateEmbauche).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="d-flex gap-3 align-items-center">
          <div className="score-badge" style={{
            borderColor: disciplineScore > 80 ? '#22c55e' : '#eab308',
            color:       disciplineScore > 80 ? '#22c55e' : '#eab308',
          }}>
            <div className="small fw-bold opacity-75">DISCIPLINE</div>
            <div className="fs-2 fw-bold">{disciplineScore}%</div>
          </div>
          <div className="text-end">
            <div className="text-muted small fw-bold">SALAIRE BASE</div>
            <h3 className="fw-bold text-jakan m-0">{worker.dailySalary} DH <small className="fs-6 text-muted">/j</small></h3>
          </div>
        </div>
      </div>

      {/* ② YEAR + MONTH SELECTOR */}
      <Row className="mb-4 align-items-center g-3">
        <Col md="auto">
          <Form.Select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="fw-bold"
            style={{ width: 110 }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </Form.Select>
        </Col>
        <Col md>
          <Nav variant="pills" className="bg-body p-2 rounded-3 shadow-sm mb-0 border overflow-auto flex-nowrap">
            {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
              <Nav.Item key={m}>
                <Nav.Link
                  active={selectedMonth === m}
                  onClick={() => setSelectedMonth(m)}
                  className="fw-bold px-4"
                >
                  Mois {m}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </Col>
      </Row>

      {/* ③ ATTENDANCE DONUT + SALARY CHART */}
      <Row className="g-4 mb-4">
        <Col lg={4}>
          <Card className="jakan-card border-0 shadow-sm p-4 h-100">
            <h5 className="fw-bold mb-4 jakan-title small">Répartition Présences (Cycle)</h5>
            <div className="chart-container d-flex align-items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statsData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {statsData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3">
              {statsData.map(d => (
                <div key={d.name} className="d-flex justify-content-between small mb-2">
                  <span className="text-muted"><CheckCircle size={12} color={d.color}/> {d.name}</span>
                  <span className="fw-bold">{d.value} Jours</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="jakan-card border-0 shadow-sm p-4 h-100">
            <h5 className="fw-bold mb-4 jakan-title small">ÉVOLUTION DES REVENUS — {selectedYear}</h5>
            <div style={{ width: '100%', height: 250, minHeight: 250 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" axisLine={false} tick={{ fill: 'var(--text-body)', fontSize: 12 }} />
                  <YAxis axisLine={false} tick={{ fill: 'var(--text-body)', fontSize: 10 }} tickFormatter={v => `${v} DH`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--jakan-blue)', borderRadius: '10px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="Salaire Net" fill="var(--jakan-blue)" radius={[6,6,0,0]} barSize={40} />
                  <Bar dataKey="Acomptes"    fill="#ef4444"            radius={[6,6,0,0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ④ TRANSACTIONS HISTORY */}
      <Row>
        <Col md={12}>
          <Card className="jakan-card border-0 shadow-sm p-4">
            <h5 className="fw-bold mb-4 jakan-title small">Historique Financier du Collaborateur</h5>
            <Table hover responsive>
              <thead>
                <tr className="text-muted small">
                  <th>Date</th>
                  <th>Catégorie</th>
                  <th>Désignation</th>
                  <th>Montant</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tr => (
                  <tr key={tr._id}>
                    <td className="small text-muted">{new Date(tr.date).toLocaleDateString()}</td>
                    <td><Badge bg="secondary bg-opacity-10" className="text-secondary">{tr.category}</Badge></td>
                    <td className="small">{tr.description}</td>
                    <td className={`fw-bold ${tr.type === 'plus' ? 'text-success' : 'text-danger'}`}>
                      {tr.type === 'plus' ? '+' : '-'}{tr.amount} DH
                    </td>
                    <td>
                      {tr.category === 'Avance' ? (
                        <Badge bg={tr.isSettled ? 'success' : 'warning'} className="px-3">
                          {tr.isSettled ? 'Déduit' : 'En attente'}
                        </Badge>
                      ) : tr.category === 'Salaire' ? (
                        <Badge bg="success" className="px-3">
                          <CheckCircle size={10} className="me-1"/> Versé
                        </Badge>
                      ) : (
                        <span className="text-muted opacity-50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default WorkerProfile;