import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Modal, Form, Toast, ToastContainer } from 'react-bootstrap';
import { ArrowLeft, PlusCircle, FileText, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './WorkerPayrollDetails.css'; 
import { useNavigate } from 'react-router-dom';
const WorkerPayrollDetails = () => {
  const { workerId, year, month } = useParams();
  const location = useLocation();
  const workerData = location.state?.worker;
  const navigate = useNavigate();
  const [stats, setStats] = useState({ brut: 0, advances: 0, net: 0, isPaid: false });
  const [days, setDays] = useState([]);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  const getRange = () => {
    const start = new Date(year, month - 2, 11);
    const end = new Date(year, month - 1, 10);
    const arr = [];
    let dt = new Date(start);
    while (dt <= end) { arr.push(new Date(dt).toISOString().split('T')[0]); dt.setDate(dt.getDate() + 1); }
    return arr;
  };
  const dateRange = getRange();

  const loadAllData = async () => {
    try {
      const [resDays, resStats] = await Promise.all([
        api.get(`/payroll/details/${workerId}/${year}/${month}`),
        api.get(`/payroll/stats/${workerId}/${year}/${month}`)
      ]);
      setDays(resDays.data);
      setStats(resStats.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadAllData(); }, [workerId, month]);

  const handleAddAdvance = async () => {
    if (!advanceAmount || Number(advanceAmount) <= 0) return;
    try {
      await api.post('/transactions', {
        type: 'minus', category: 'Avance', amount: Number(advanceAmount),workerId: workerId,
        description: `Acompte: ${workerData?.name || 'Ouvrier'} [ID:${workerId}]` 
      });
      setShowAdvanceModal(false); setAdvanceAmount('');
      await loadAllData();
      setToast({ show: true, message: 'Acompte enregistré avec succès !', variant: 'success' });
    } catch (err) { setToast({ show: true, message: 'Erreur lors de l\'enregistrement', variant: 'danger' }); }
  };

const generatePDF = () => {
  const doc = new jsPDF();
  const logoUrl = "/logo.jpg";

  /* ───── HEADER ───── */

  try {
    doc.addImage(logoUrl, "JPG", 14, 10, 25, 25);
  } catch (e) {}

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("GIL JAKAN", 45, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("ALUMINIUM & MENUISERIE", 45, 24);

  doc.setDrawColor(200);
  doc.line(14, 35, 196, 35);

  /* ───── EMPLOYEE INFO ───── */

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Employé :", 14, 45);
  doc.text("Période :", 14, 52);

  doc.setFont("helvetica", "normal");
  doc.text(workerData?.name?.toUpperCase() || "-", 45, 45);
  doc.text(`11/${(month - 1) || 12} au 10/${month}/${year}`, 45, 52);

  /* ───── ATTENDANCE TABLE ───── */

  autoTable(doc, {
    startY: 60,
    head: [["Date", "Statut", "Bonus déplacement"]],
    body: dateRange.map((d) => {
      const r = days.find((x) => x.date === d);
      return [
        d,
        r?.status?.toUpperCase() || "ABSENT",
        r?.displacement ? "OUI (+0.5)" : "-",
      ];
    }),
    theme: "grid",
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: 0,
    },
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
  });

  /* ───── SALARY SUMMARY ───── */

  const finalY = doc.lastAutoTable.finalY + 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Résumé de la paie", 140, finalY);

  doc.setFont("helvetica", "normal");

  doc.text("Total brut :", 120, finalY + 10);
  doc.text(`${stats.brut} DH`, 190, finalY + 10, { align: "right" });

  doc.text("Acomptes :", 120, finalY + 18);
  doc.text(`-${stats.advances} DH`, 190, finalY + 18, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.text("Net à payer :", 120, finalY + 28);
  doc.text(`${stats.net} DH`, 190, finalY + 28, { align: "right" });

  /* ───── FOOTER ───── */

  doc.setDrawColor(200);
  doc.line(14, 285, 196, 285);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Document généré par le système de gestion GIL JAKAN",
    105,
    292,
    { align: "center" }
  );

  doc.save(`Paie_${workerData?.name}_${month}.pdf`);
};

  return (
    <Container fluid className="py-4">
      {/* ── TOP ACTIONS ── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button 
           variant="link" 
           onClick={() => navigate(-1)} 
           className="text-jakan p-0 text-decoration-none fw-bold d-flex align-items-center"
        >
          <ArrowLeft size={20} className="me-2"/> RETOUR
        </Button>
        <Button onClick={generatePDF} className="btn-jakan-pdf shadow-sm">
            <FileText size={18} className="me-2" /> TÉLÉCHARGER FICHE PAIE
        </Button>
      </div>

      <h2 className="jakan-title mb-4">DOSSIER DE PAIE : <span className="text-jakan">{workerData?.name}</span></h2>

      <Row className="g-4">
        {/* ── CALENDAR ── */}
        <Col lg={8}>
          <Card className="jakan-card p-4 h-100 shadow-sm border-0">
            <h5 className="fw-bold mb-4 jakan-title">Pointage du Cycle (11 au 10)</h5>
            <div className="jakan-calendar-grid">
              {dateRange.map((dateStr, i) => {
                const record = days.find(d => d.date === dateStr);
                const dayLabel = dateStr.split('-')[2];
                return (
                  <div key={i} className={`day-card ${!record ? 'absent' : ''} ${record?.status}`}>
                    <span className="day-label">JOUR</span>
                    <span className="day-number">{dayLabel}</span>
                    {record?.displacement && <div className="bg-info rounded-circle mt-1" style={{width:6,height:6}}/>}
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* ── SUMMARY ── */}
        <Col lg={4}>
          <Card className="summary-card-pro border-0 h-100">
             <h5 className="fw-bold mb-4 opacity-75">RÉSUMÉ DU MOIS</h5>
             
            <div className="stat-line text-white"> {/* Force text-white class */}
              <span className="opacity-75">Brut Total</span> 
              <span className="fw-bold text-white">{stats.brut} DH</span>
            </div>
            <div className="stat-line" style={{ color: '#ffd700' }}> {/* Gold color for advances */}
              <span>Acomptes</span> 
              <span className="fw-bold">-{stats.advances} DH</span>
            </div>
             
             <hr style={{ borderColor: 'rgba(255,255,255,0.2)' }}/>
             
             <div className="mt-4">
                <h6 className="mb-0 opacity-75">MONTANT NET À PAYER</h6>
                <div className="net-amount">{stats.net} DH</div>
             </div>

              {stats.isPaid ? (
                <div className="mt-4 p-3 bg-white bg-opacity-25 rounded-3 text-center fw-bold border border-white border-opacity-50 shadow-inner" 
                    style={{ color: '#002d72' }}> {/* Forced dark blue text for high contrast */}
                  <CheckCircle size={20} className="me-2"/> SALAIRE RÉGLÉ
                </div>
              ) : (
                <Button className="btn-jakan-light w-100 mt-4 shadow" onClick={() => setShowAdvanceModal(true)}>
                  <PlusCircle size={20} className="me-2"/> AJOUTER ACOMPTE
                </Button>
              )}
          </Card>
        </Col>
      </Row>

      <Modal show={showAdvanceModal} onHide={() => setShowAdvanceModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0"><Modal.Title className="fs-6 fw-bold jakan-title text-dark">Donner une Avance</Modal.Title></Modal.Header>
        <Modal.Body className="text-center pt-0">
            <Form.Control type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} className="fs-2 fw-bold text-center border-0 bg-light py-3 text-dark" placeholder="0" autoFocus />
            <Button variant="primary" className="w-100 fw-bold mt-3 py-2 shadow-sm" onClick={handleAddAdvance}>VALIDER L'AVANCE</Button>
        </Modal.Body>
      </Modal>

      {/* ── TOASTS ── */}
      <ToastContainer position="top-end" className="p-3">
        <Toast onClose={() => setToast({...toast, show:false})} show={toast.show} delay={3000} autohide bg={toast.variant} className="text-white border-0 shadow">
          <Toast.Body className="fw-bold d-flex align-items-center gap-2">
            {toast.variant === 'success' ? <CheckCircle size={18}/> : <XCircle size={18}/>} {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default WorkerPayrollDetails;