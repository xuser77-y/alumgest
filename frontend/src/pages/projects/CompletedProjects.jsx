import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form } from 'react-bootstrap';
import { ArrowRight, TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, Package, Settings, Search } from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const CompletedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const res = await api.get('/projects?status=completed');
      setProjects(res.data);
    };
    fetch();
  }, []);

  // ── SUMMARY CALCULATIONS ──
  const totalRevenue    = projects.reduce((s, p) => s + (p.totalPrice || 0), 0);
  const totalSpent      = projects.reduce((s, p) => s + (p.finalSpent || 0), 0);
  const totalCollected  = projects.reduce((s, p) => s + (p.advancePayment || 0), 0);
  const totalProfit     = totalRevenue - totalSpent;
  const totalDebt       = projects.reduce((s, p) => s + Math.max(0, (p.totalPrice || 0) - (p.advancePayment || 0)), 0);
  const avgMargin       = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
  const unpaidCount     = projects.filter(p => (p.totalPrice - p.advancePayment) > 0).length;

  const filteredProjects = projects.filter(p => 
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.client?.name && p.client.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2 className="jakan-title m-0">PROJETS <span className="text-success">TERMINÉS</span></h2>
        <div className="d-flex gap-2">
            <div className="search-wrapper shadow-sm">
                <Search size={18} className="ms-3 text-muted" />
                <Form.Control 
                    placeholder="Rechercher villa ou client..." 
                    className="border-0 bg-transparent py-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* ── SUMMARY STRIP ── */}
      <div className="summary-strip-jakan mb-4">
        <div className="ss-box blue">
          <div className="ss-lbl">Chiffre d'Affaires</div>
          <div className="ss-val">{totalRevenue.toLocaleString()} DH</div>
        </div>
        <div className="ss-box green">
          <div className="ss-lbl">Bénéfice Total</div>
          <div className="ss-val">{totalProfit.toLocaleString()} DH</div>
          <div className="x-small text-muted fw-bold">Marge {avgMargin}%</div>
        </div>
        <div className="ss-box red">
          <div className="ss-lbl">Total Dépensé</div>
          <div className="ss-val">{totalSpent.toLocaleString()} DH</div>
        </div>
        <div className="ss-box amber">
          <div className="ss-lbl">Créances Clients</div>
          <div className="ss-val">{totalDebt.toLocaleString()} DH</div>
          <div className="x-small text-muted fw-bold">{unpaidCount} projet{unpaidCount !== 1 ? 's' : ''} impayé{unpaidCount !== 1 ? 's' : ''}</div>
        </div>
        <div className="ss-box">
          <div className="ss-lbl">Projets Terminés</div>
          <div className="ss-val">{projects.length}</div>
          <div className="x-small text-muted fw-bold">{projects.length - unpaidCount} soldés</div>
        </div>
      </div>

      {/* ── PROJECT CARDS ── */}
      <Row className="g-4">
        {filteredProjects.map(p => {
          const profit = p.totalPrice - p.finalSpent;
          const profitMargin = Math.round((profit / p.totalPrice) * 100);
          const debt = p.totalPrice - p.advancePayment;

          // ── AGING DEBT LOGIC ──
          const getCardStyle = () => {
            if (debt <= 0 || !p.finishedAt) return { background: 'var(--bg-card)' };
            
            const finishedDate = new Date(p.finishedAt);
            const now = new Date();
            const diffMonths = (now.getFullYear() - finishedDate.getFullYear()) * 12 + (now.getMonth() - finishedDate.getMonth());

            if (diffMonths >= 3) return { background: '#f8d7da', border: '2px solid #dc3545' }; // Solid Red Alert
            if (diffMonths >= 2) return { background: '#ffffcc', border: '2px solid #ffc107' }; // Brighter Yellow Alert
            return { background: 'var(--bg-card)' };
          };

          return (
            <Col md={6} lg={4} key={p._id}>
              <Card className="project-card-jakan shadow-sm h-100 position-relative" style={getCardStyle()}>
                <div className="project-accent-bar" style={{ background: debt > 0 ? '#ee3f58' : '#16b870' }} />
                
                {/* SETTINGS BUTTON (GEAR ICON) */}
                <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 10 }}>
                    <Button variant="link" className="text-muted p-0" onClick={() => navigate(`/projects/details/${p._id}`)}>
                        <Settings size={20} />
                    </Button>
                </div>

                <Card.Body className="p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-3 pe-4">
                    <h4 className="jakan-title m-0 text-truncate" style={{ maxWidth: '80%' }}>{p.client?.name || 'Client Inconnu'}</h4>
                  </div>

                  <div className="d-flex justify-content-between mb-3">
                    <div className="text-muted small"><span className="fw-bold">Chantier:</span> {p.projectName}</div>
                    {debt > 0 ? (
                      <Badge bg="danger" className="px-2 py-1 shadow-sm pulse">IMPAYÉ</Badge>
                    ) : (
                      <Badge bg="success" className="px-2 py-1 shadow-sm">PAYÉ</Badge>
                    )}
                  </div>

                  <div className="p-3 rounded-4 border bg-white bg-opacity-50 d-flex justify-content-between align-items-center mb-3 shadow-sm">
                    <div>
                      <div className="x-small fw-bold text-muted">BÉNÉFICE RÉEL</div>
                      <div className={`fs-4 fw-bold ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
                        {profit.toLocaleString()} DH
                      </div>
                    </div>
                    <Badge bg={profit >= 0 ? 'success' : 'danger'} className="px-3 py-2">
                      {profit >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/>} {profitMargin}%
                    </Badge>
                  </div>

                  <div className="d-flex justify-content-between x-small text-muted mb-2">
                    <span>PRIX VENDU: {p.totalPrice} DH</span>
                    <span>COÛT MATÉRIAUX: {p.finalSpent} DH</span>
                  </div>

                  {debt > 0 && (
                    <div className="mt-auto mb-3 p-2 bg-danger bg-opacity-10 rounded border border-danger border-opacity-25 text-center">
                      <span className="text-danger fw-bold small">Reste à récupérer : {debt.toLocaleString()} DH</span>
                    </div>
                  )}

                  <div className="d-flex gap-2 mt-auto">
                    <Button 
                        variant="primary" 
                        size="sm" 
                        className="px-4 fw-bold rounded-3 shadow-sm flex-grow-1" 
                        onClick={() => navigate(`/projects/details/${p._id}`)}
                    >
                        OUVRIR <ArrowRight size={14} className="ms-1"/>
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default CompletedProjects;