import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, Badge, Modal, Toast, ToastContainer } from 'react-bootstrap';
import { Wallet, CheckCircle, ChevronRight, DollarSign, XCircle ,AlertTriangle  } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Payroll = () => {
  const navigate = useNavigate();
  const [years, setYears] = useState([]);
  const [report, setReport] = useState([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [isPaying, setIsPaying] = useState(false);
  const [date, setDate] = useState(() => {
    const saved = localStorage.getItem('payroll_view_date');
    return saved ? JSON.parse(saved) : { 
      month: (new Date().getMonth() + 1).toString().padStart(2, '0'), 
      year: new Date().getFullYear().toString() 
    };
  });
  const fetchData = async () => {
    try {
      const resYears = await api.get('/payroll/years');
      setYears(resYears.data);
      const resReport = await api.get(`/payroll/report?month=${date.month}&year=${date.year}`);
      setReport(resReport.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    localStorage.setItem('payroll_view_date', JSON.stringify(date));
    fetchData(); 
  }, [date]);

  const handlePayment = async () => {
    setIsPaying(true);
    try {
      const totalDaysCalculated = selectedWorker.stats.full + (selectedWorker.stats.half * 0.5);
      
      await api.post('/payroll/confirm', {
        workerId: selectedWorker._id,
        workerName: selectedWorker.name,
        month: date.month,
        year: date.year,
        netAmount: selectedWorker.net,
        brut: selectedWorker.brut,
        advances: selectedWorker.advances,
        totalDays: totalDaysCalculated, // Ensure this matches schema
        totalBonus: selectedWorker.stats.bonus
      });
      setShowPayModal(false);
      fetchData();
      setToast({ show: true, message: 'Paiement validé avec succès !', variant: 'success' });
    } catch (err) { 
      console.error(err);
      setToast({ 
        show: true, 
        message: err.response?.data?.message || 'Erreur lors du paiement', 
        bg: 'danger', 
        variant: 'danger' 
      });
    } finally {
      setIsPaying(false);
    }
  };

  const totalPayout = report.reduce((acc, curr) => acc + (curr.isPaid ? 0 : curr.net), 0);

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="fw-bold m-0 jakan-title">ÉTAT DES <span className="text-jakan">SALAIRES</span></h2>
          <p className="text-muted">Calcul basé sur le cycle du 11 au 10.</p>
        </div>
        <div className="d-flex gap-2">
            <Form.Select className="fw-bold border-secondary shadow-sm bg-body" onChange={(e) => setDate({...date, month: e.target.value})} value={date.month}>
                <option value="01">Janvier</option><option value="02">Février</option><option value="03">Mars</option><option value="04">Avril</option><option value="05">Mai</option><option value="06">Juin</option><option value="07">Juillet</option><option value="08">Août</option><option value="09">Septembre</option><option value="10">Octobre</option><option value="11">Novembre</option><option value="12">Décembre</option>
            </Form.Select>
            <Form.Select className="fw-bold border-secondary shadow-sm bg-body" onChange={(e) => setDate({...date, year: e.target.value})} value={date.year}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
            </Form.Select>
        </div>
      </div>

      <Card className="jakan-card mb-4 border-0 shadow-lg text-white" style={{ background: 'var(--jakan-gradient)' }}>
        <Card.Body className="p-4 d-flex justify-content-between align-items-center">
            <div>
                <h6 className="opacity-75 uppercase small fw-bold">Dette Totale de l'Atelier</h6>
                <h1 className="fw-bold mb-0" style={{ fontSize: '3rem' }}>{totalPayout.toLocaleString()} <small className="fs-4">DH</small></h1>
            </div>
            <Wallet size={80} className="opacity-25" />
        </Card.Body>
      </Card>

      <div className="jakan-table shadow-sm bg-body">
        <Table hover responsive className="m-0 align-middle">
          <thead className="bg-body-tertiary">
            <tr>
              <th className="ps-4">Ouvrier</th>
              <th className="text-center">Pointage</th>
              <th className="text-center">Salaire Brut</th>
              <th className="text-center">Acomptes</th>
              <th className="text-center">Net à Payer</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {report.map(row => (
              <tr key={row._id} style={{ opacity: row.isPaid ? 0.6 : 1 }}>
                <td className="ps-4 py-3">
                  <div 
                    className="d-flex align-items-center gap-3"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/workers/profile/${row._id}`)}
                  >
                    {/* Small Avatar icon for consistency */}
                    <div className="worker-avatar-circle" style={{ width: '35px', height: '35px', fontSize: '0.9rem' }}>
                      {row.name[0]}
                    </div>
                    
                    <div>
                      <div className="fw-bold fs-6 text-jakan-hover">{row.name}</div>
                      <small className="text-muted">{row.poste}</small>
                    </div>
                  </div>
                </td>
                <td className="text-center">
                    <Badge bg="success" className="me-1">{row.stats.full}P</Badge>
                    <Badge bg="warning" className="text-dark me-1">{row.stats.half}D</Badge>
                    <Badge bg="danger" className="me-1">{row.stats.bonus}B</Badge>
                    <Badge bg="primary">{row.stats.bonus}DP</Badge>
                </td>
                <td className="text-center fw-bold">{row.brut} DH</td>
                <td className="text-center text-danger fw-bold">-{row.advances} DH</td>
                <td className="text-center">
                    <div className={`fs-5 fw-bold ${row.isPaid ? 'text-success' : (row.net < 0 ? 'text-danger' : 'text-jakan')}`}>
                        {row.isPaid ? (
                            <Badge bg="success" className="px-3 py-2"><CheckCircle size={14}/> RÉGLÉ</Badge>
                        ) : (
                            `${row.net} DH`
                        )}
                    </div>
                    {row.net < 0 && !row.isPaid && <small className="text-danger fw-bold" style={{fontSize:'0.65rem'}}>Dette à reporter</small>}
                </td>

                <td className="text-end pe-4">
                    <div className="d-flex gap-2 justify-content-end">
                        {!row.isPaid && (
                            <Button 
                                variant={row.net < 0 ? "outline-danger" : "success"} 
                                size="sm" 
                                className="fw-bold px-3 shadow-sm"
                                onClick={() => { setSelectedWorker(row); setShowPayModal(true); }}
                            >
                                {row.net < 0 ? 'REPORTER DETTE' : 'PAYER'}
                            </Button>
                        )}
                        <Button variant="outline-primary" size="sm" className="fw-bold" onClick={() => navigate(`/workers/payroll/${row._id}/${date.year}/${date.month}`, { state: { worker: row } })}>
                            Détails
                        </Button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Payment Confirmation Modal */}
      <Modal show={showPayModal} onHide={() => setShowPayModal(false)} centered size="sm">
        <Modal.Body className="text-center p-4">
          {selectedWorker?.net < 0 ? (
              <>
                  <div className="text-danger mb-3"><AlertTriangle size={50} /></div>
                  <h5 className="fw-bold">Report de Dette</h5>
                  <p className="text-muted small">
                      L'ouvrier a un solde de <strong>{selectedWorker?.net} DH</strong>. 
                      Voulez-vous clore ce mois et reporter la dette au mois prochain ?
                  </p>
              </>
          ) : (
              <>
                  <div className="text-success mb-3"><DollarSign size={50} /></div>
                  <h5 className="fw-bold">Confirmer Paiement</h5>
                  <p className="text-muted small">
                      Voulez-vous verser <strong>{selectedWorker?.net} DH</strong> cash à {selectedWorker?.name} ?
                  </p>
              </>
          )}
          <div className="d-grid gap-2 mt-4">
            <Button 
              variant={selectedWorker?.net < 0 ? "danger" : "primary"} 
              className="fw-bold py-2" 
              onClick={handlePayment}
              disabled={isPaying}
            >
              {isPaying ? "EN COURS..." : (selectedWorker?.net < 0 ? "OUI, REPORTER" : "OUI, PAYER MAINTENANT")}
            </Button>
            <Button variant="light" className="small" onClick={() => setShowPayModal(false)} disabled={isPaying}>Annuler</Button>
          </div>
        </Modal.Body>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast onClose={() => setToast({ ...toast, show: false })} show={toast.show} delay={3000} autohide bg={toast.variant} className="text-white">
          <Toast.Body><CheckCircle size={18}/> {toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default Payroll;