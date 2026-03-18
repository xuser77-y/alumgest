import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Form, ProgressBar } from 'react-bootstrap';
import { Wallet, CheckCircle, Clock, Calendar as CalIcon } from 'lucide-react';
import api from '../../services/api';
import '../workers/WorkerPayrollDetails.css'; // Reusing your high-end CSS

const WorkerDashboard = () => {
  const [data, setData] = useState(null);
  const [years, setYears] = useState([]);
  
  // ── DATE STATES ──
  const [selMonth, setSelMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [selYear, setSelYear] = useState(new Date().getFullYear().toString());

  const months = [
    {v:'01', l:'Jan'}, {v:'02', l:'Fév'}, {v:'03', l:'Mar'}, {v:'04', l:'Avr'},
    {v:'05', l:'Mai'}, {v:'06', l:'Jun'}, {v:'07', l:'Jul'}, {v:'08', l:'Aoû'},
    {v:'09', l:'Sep'}, {v:'10', l:'Oct'}, {v:'11', l:'Nov'}, {v:'12', l:'Déc'}
  ];

  const loadAll = async () => {
    try {
      const [resYears, resStats] = await Promise.all([
        api.get('/payroll/years'),
        api.get(`/workers/my-stats?year=${selYear}&month=${selMonth}`)
      ]);
      setYears(resYears.data);
      setData(resStats.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadAll(); }, [selMonth, selYear]);

  // ── 10th to 10th Range logic ──
  const getRange = () => {
    const start = new Date(Number(selYear), Number(selMonth) - 2, 11);
    const end = new Date(Number(selYear), Number(selMonth) - 1, 10);
    const arr = [];
    let dt = new Date(start);
    while (dt <= end) {
      arr.push(new Date(dt).toISOString().split('T')[0]);
      dt.setDate(dt.getDate() + 1);
    }
    return arr;
  };

  if (!data) return <div className="p-5 text-center jakan-title">Accès à votre dossier personnel...</div>;

  return (
    <Container className="py-4">
      {/* ── HEADER & YEAR SELECT ── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="jakan-title mb-1 text-title">MON <span className="text-jakan">DOSSIER</span></h2>
          <p className="text-muted small m-0">Cycle de paie du 11 au 10.</p>
        </div>
        <div className="d-flex align-items-center gap-2 bg-body p-2 rounded-3 border shadow-sm">
            <CalIcon size={18} className="text-jakan ms-1" />
            <Form.Select 
                value={selYear} 
                onChange={(e) => setSelYear(e.target.value)}
                className="border-0 bg-transparent fw-bold p-0 pe-4"
                style={{ width: 'auto' }}
            >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
            </Form.Select>
        </div>
      </div>

      {/* ── MONTH PILLS ── */}
      <div className="month-pills-container d-flex gap-1 bg-body p-1 rounded-3 border shadow-sm mb-4 overflow-auto flex-nowrap">
          {months.map((m) => (
            <button 
                key={m.v} 
                className={`btn btn-sm fw-bold border-0 px-3 flex-grow-1 ${selMonth === m.v ? 'btn-primary shadow' : 'text-muted'}`}
                onClick={() => setSelMonth(m.v)}
            >
                {m.l}
            </button>
          ))}
      </div>

      {/* ── KPI ROW ── */}
      <Row className="g-4 mb-4">
        <Col xs={12} md={6}>
            <Card className="summary-card-pro border-0 p-4 shadow-lg h-100">
                <div className="d-flex justify-content-between text-white">
                    <h6 className="opacity-75 small fw-bold uppercase text-white">
                        {data.isPaid ? "ACOMPTES DÉDUITS" : "ACOMPTES À DÉDUIRE"}
                    </h6>
                    <Wallet size={24} className="text-white" />
                </div>
                
                <h1 className="fw-bold m-0 mt-2 text-white" style={{fontSize: '3rem'}}>
                    {data.totalAdvances} <small className="fs-6">DH</small>
                </h1>

                {/* ── FIXED DYNAMIC PÉRIODE LABEL ── */}
                <div className="mt-3 p-2 bg-white bg-opacity-10 rounded border border-white border-opacity-10 small text-white text-center fw-bold">
                  Période du 11/{data.period?.start.m}/{data.period?.start.y} au 10/{data.period?.end.m}/{data.period?.end.y}
                </div>
                
                {data.isPaid && (
                  <Badge bg="white" className="text-success mt-2 py-2 shadow-sm">
                      <CheckCircle size={12} className="me-1"/> MOIS DÉJÀ RÉGLÉ
                  </Badge>
                )}
            </Card>
        </Col>

        <Col xs={12} md={6}>
            <Card className="jakan-card border-0 shadow-sm p-4 h-100 bg-body">
                <div className="d-flex justify-content-between">
                    <h6 className="text-muted small fw-bold uppercase">Présences validées</h6>
                    <CheckCircle size={24} className="text-success" />
                </div>
                <h1 className="fw-bold m-0 mt-2 text-title">
                    {data.attendance.filter(a => a.status === 'full').length} Jours
                </h1>
                
                {/* Calcul du score basé sur les jours pleins sur 26 jours max environ */}
                <ProgressBar 
                    now={(data.attendance.filter(a => a.status === 'full').length / 26) * 100} 
                    variant="success" 
                    style={{height:8}} 
                    className="mt-4 rounded-pill shadow-inner" 
                />
                <small className="text-muted mt-2 d-block">
                    Assiduité sur ce cycle
                </small>
            </Card>
        </Col>
      </Row>

      {/* ── MONTHLY CALENDAR ── */}
      <Card className="jakan-card border-0 shadow-sm p-4 mb-5 bg-body">
        <h5 className="fw-bold mb-4 jakan-title small uppercase opacity-75 text-title text-center">Calendrier de Travail</h5>
        <div className="jakan-calendar-grid">
          {getRange().map((dateStr, i) => {
            const record = data.attendance.find(d => d.date === dateStr);
            const dayLabel = dateStr.split('-')[2];
            return (
              <div key={i} className={`day-card ${!record ? 'absent' : ''} ${record?.status}`}>
                <span className="day-label">JOUR</span>
                <span className="day-number">{dayLabel}</span>
                {record?.displacement && <div className="bg-info rounded-circle mt-1 shadow-sm" style={{width:8,height:8}}/>}
              </div>
            );
          })}
        </div>
        
        {/* LEGEND */}
        <div className="mt-4 d-flex gap-3 flex-wrap border-top pt-3 justify-content-center">
             <div className="small fw-bold d-flex align-items-center gap-1 text-title"><div className="bg-success rounded-circle" style={{width:10,height:10}}/> Présent</div>
             <div className="small fw-bold d-flex align-items-center gap-1 text-title"><div className="bg-warning rounded-circle" style={{width:10,height:10}}/> Demi-jour</div>
             <div className="small fw-bold d-flex align-items-center gap-1 text-title"><div className="bg-danger rounded-circle" style={{width:10,height:10}}/> Absent</div>
             <div className="small fw-bold d-flex align-items-center gap-1 text-title"><div className="bg-info rounded-circle" style={{width:10,height:10}}/> Chantier Site</div>
        </div>
      </Card>
    </Container>
  );
};

export default WorkerDashboard;