import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Modal, Form, Toast, ToastContainer } from 'react-bootstrap';
import { ArrowLeft, PlusCircle, FileText, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { amiriFont } from '../../utils/amiriFont';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [editStatus, setEditStatus] = useState('full');
  const [editDisplacement, setEditDisplacement] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getRange = () => {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
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
        description: `Acompte: ${workerData?.name || 'Ouvrier'}` 
      });
      setShowAdvanceModal(false); setAdvanceAmount('');
      await loadAllData();
      setToast({ show: true, message: 'Acompte enregistré avec succès !', variant: 'success' });
    } catch (err) { setToast({ show: true, message: 'Erreur lors de l\'enregistrement', variant: 'danger' }); }
  };

  const handleDayClick = (dateStr, record) => {
    if (stats.isPaid) return;
    setSelectedDay({ date: dateStr, ...record });
    setEditStatus(record?.status || 'absent');
    setEditDisplacement(record?.displacement || false);
    setShowEditModal(true);
  };

  const handleUpdateAttendance = async () => {
    if (!selectedDay) return;
    try {
      await api.post('/attendance/bulk', {
        date: selectedDay.date,
        records: [{
          workerId: workerId,
          status: editStatus,
          displacement: editDisplacement
        }]
      });
      setShowEditModal(false);
      await loadAllData();
      setToast({ show: true, message: 'Pointage mis à jour !', variant: 'success' });
    } catch (err) {
      setToast({ show: true, message: 'Erreur lors de la mise à jour', variant: 'danger' });
    }
  };

  const handleDeleteAttendance = () => {
    if (!selectedDay) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/attendance/${workerId}/${selectedDay.date}`);
      setShowDeleteConfirm(false);
      setShowEditModal(false);
      await loadAllData();
      setToast({ show: true, message: 'Pointage supprimé avec succès !', variant: 'success' });
    } catch (err) {
      setToast({ show: true, message: 'Erreur lors de la suppression', variant: 'danger' });
    }
  };

const generatePDF = () => {  const doc = new jsPDF();
  doc.addFileToVFS('amiri.ttf', amiriFont);
  doc.addFont('amiri.ttf', 'amiri', 'normal');

  const logoUrl = '/logo.jpg';
  try { doc.addImage(logoUrl, 'JPG', 14, 10, 25, 25); } catch(e){}

  doc.setFont("amiri", "normal");
  doc.setFontSize(18);
  doc.text("GIL JAKAN", 45, 18);

  doc.setFont("amiri", "normal");
  doc.setFontSize(10);
  doc.text("ALUMINIUM & MENUISERIE", 45, 24);

  doc.setDrawColor(200);
  doc.line(14, 35, 196, 35);

  /* ───── INFO OUVRIER ───── */

  doc.setFontSize(11);
  doc.setFont("amiri", "normal");
  doc.text("FICHE DE PAIE :", 14, 45);
  doc.text("PÉRIODE :", 14, 52);

  doc.setFont("amiri", "normal");
  doc.text(workerData?.name?.toUpperCase() || "-", 45, 45);
  const endD = new Date(year, month, 0);
  const lastDay = endD.getDate();
  doc.text(`01/${month}/${year} au ${lastDay}/${month}/${year}`, 45, 52);

  /* ───── ATTENDANCE TABLE ───── */

  autoTable(doc, {
    startY: 60,
    head: [['Date', 'Statut', 'Déplacement']],
    body: days.map(d => [
      d.date, 
      d.status === 'full' ? 'Présent' : d.status === 'half' ? 'Demi-jour' : 'Absent',
      d.displacement ? 'Oui' : 'Non'
    ]),
    theme: 'grid',
    headStyles: { fillColor: [240,240,240], textColor: 0, font: 'amiri' },
    styles: { fontSize: 9, font: 'amiri' }
  });

  /* ───── RÉCAP ───── */
  let finalY = doc.lastAutoTable.finalY + 15;

  doc.setFont("amiri", "normal");
  doc.setFontSize(12);
  doc.text("Récapitulatif Financier", 140, finalY);

  doc.setFont("amiri", "normal");
  doc.setFontSize(10);
  doc.text("Total Brut :", 120, finalY + 10);
  doc.text(`${stats.brut} DH`, 190, finalY + 10, { align: 'right' });

  doc.text("Total Acomptes :", 120, finalY + 18);
  doc.text(`${stats.advances} DH`, 190, finalY + 18, { align: 'right' });

  doc.setFont("amiri", "bold");
  doc.text("Net à Payer :", 120, finalY + 28);
  doc.text(`${stats.net} DH`, 190, finalY + 28, { align: 'right' });

  /* ───── FOOTER ───── */
  doc.setDrawColor(200);
  doc.line(14, 285, 196, 285);
  doc.setFontSize(8);
  doc.setFont("amiri", "normal");
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
            <h5 className="fw-bold mb-4 jakan-title">Pointage Mensuel</h5>
            <div className="jakan-calendar-grid">
              {dateRange.map((dateStr, i) => {
                const record = days.find(d => d.date === dateStr);
                const dayLabel = dateStr.split('-')[2];
                return (
                  <div 
                    key={i} 
                    className={`day-card ${!record ? 'missing' : record.status} ${!stats.isPaid ? 'editable' : ''}`}
                    onClick={() => handleDayClick(dateStr, record)}
                  >
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
                <Button className="btn-acompte-pro w-100 mt-4 shadow" onClick={() => setShowAdvanceModal(true)}>
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

      {/* ── ATTENDANCE EDIT MODAL ── */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-6 fw-bold jakan-title text-dark">
            Pointage du {selectedDay && new Date(selectedDay.date).toLocaleDateString('fr-FR')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted uppercase">Statut du Jour</Form.Label>
            <div className="d-flex justify-content-center gap-2">
              <Button 
                className={editStatus === 'full' ? 'btn-status shadow-sm' : 'btn-status btn-status-outline'}
                variant={editStatus === 'full' ? 'success' : ''} 
                onClick={() => setEditStatus('full')}
              >
                Plein
              </Button>
              <Button 
                className={editStatus === 'half' ? 'btn-status shadow-sm' : 'btn-status btn-status-outline'}
                variant={editStatus === 'half' ? 'warning' : ''} 
                onClick={() => setEditStatus('half')}
              >
                Demi
              </Button>
              <Button 
                className={editStatus === 'absent' ? 'btn-status shadow-sm' : 'btn-status btn-status-outline'}
                variant={editStatus === 'absent' ? 'danger' : ''} 
                onClick={() => {
                  setEditStatus('absent');
                  setEditDisplacement(false);
                }}
              >
                Absent
              </Button>
            </div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Check 
              type="switch"
              id="displacement-switch"
              label="Déplacement (Site)"
              checked={editDisplacement}
              disabled={editStatus === 'absent'}
              onChange={(e) => setEditDisplacement(e.target.checked)}
              className="fw-bold"
            />
          </Form.Group>

          <Button variant="primary" className="w-100 fw-bold py-2 shadow-sm" onClick={handleUpdateAttendance}>
            ENREGISTRER
          </Button>

          <Button variant="outline-danger" className="w-100 fw-bold py-2 mt-2 border-0" onClick={handleDeleteAttendance}>
            SUPPRIMER LE POINTAGE
          </Button>
        </Modal.Body>
      </Modal>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered size="sm">
        <Modal.Body className="text-center p-4">
          <div className="text-danger mb-3 mt-2">
            <XCircle size={54} strokeWidth={1.5} />
          </div>
          <h4 className="jakan-title mb-2">Supprimer le Pointage ?</h4>
          <p className="text-muted small">
            Voulez-vous vraiment retirer la présence du <br />
            <strong className="text-dark">{selectedDay && new Date(selectedDay.date).toLocaleDateString('fr-FR')}</strong> ?
          </p>
          <div className="d-grid gap-2 mt-4">
            <Button variant="danger" className="fw-bold py-2 shadow-sm" onClick={confirmDelete}>
              OUI, SUPPRIMER
            </Button>
            <Button variant="link" className="text-muted text-decoration-none small" onClick={() => setShowDeleteConfirm(false)}>
              Annuler
            </Button>
          </div>
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