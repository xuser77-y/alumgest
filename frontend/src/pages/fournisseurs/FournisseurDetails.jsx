import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Toast, ToastContainer } from 'react-bootstrap';
import { ArrowLeft, Plus, DollarSign, FileText, ShoppingCart, Truck, CreditCard, Edit3, Trash2, CheckCircle, XCircle, Lock, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { amiriFont } from '../../utils/amiriFont';

const FournisseurDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fournisseur, setFournisseur] = useState(null);
  const [history, setHistory] = useState([]);
  
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showChequeModal, setShowChequeModal] = useState(false);
  const [showRemiseModal, setShowRemiseModal] = useState(false);
  const [showEditHistoryModal, setShowEditHistoryModal] = useState(false);
  const [showDeleteHistoryModal, setShowDeleteHistoryModal] = useState(false);
  const [showPayChequeModal, setShowPayChequeModal] = useState(false);
  
  const [toast, setToast] = useState({ show: false, message: '', bg: 'success' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', action: null });
  
  const [formData, setFormData] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [filterType, setFilterType] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');

  const showToast = (message, bg = 'success') => setToast({ show: true, message, bg });

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/fournisseurs/${id}`);
      setFournisseur(res.data.fournisseur);
      setHistory(res.data.history);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du chargement des données');
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleAddPurchase = (e) => {
    e.preventDefault();
    setConfirmConfig({
      title: "Confirmer l'Achat",
      message: `Êtes-vous sûr de vouloir enregistrer cet achat de ${formData.amount} DH ?`,
      action: executePurchase
    });
    setShowConfirmModal(true);
  };

  const executePurchase = async () => {
    try {
      await api.post(`/fournisseurs/${id}/purchase`, formData);
      setShowPurchaseModal(false);
      setShowConfirmModal(false);
      setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchDetails();
      showToast("Achat enregistré avec succès.");
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de l'ajout de l'achat.", "danger");
      setShowConfirmModal(false);
    }
  };

  const handleAddPayment = (e) => {
    e.preventDefault();
    setConfirmConfig({
      title: "Confirmer le Paiement",
      message: `Êtes-vous sûr de vouloir enregistrer ce paiement de ${formData.amount} DH ? Cela sera déduit de la caisse globale.`,
      action: executePayment
    });
    setShowConfirmModal(true);
  };

  const executePayment = async () => {
    try {
      await api.post(`/fournisseurs/${id}/payment`, formData);
      setShowPaymentModal(false);
      setShowConfirmModal(false);
      setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchDetails();
      showToast("Paiement enregistré avec succès.");
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de l'ajout du paiement.", "danger");
      setShowConfirmModal(false);
    }
  };

  const executeCheque = async () => {
    try {
      await api.post(`/fournisseurs/${id}/cheque`, formData);
      setShowChequeModal(false);
      setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchDetails();
      showToast("Chèque enregistré avec succès (Non payé).", "warning");
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de l'ajout du chèque.", "danger");
    }
  };

  const handleAddRemise = (e) => {
    e.preventDefault();
    setConfirmConfig({
      title: "Confirmer la Remise",
      message: `Êtes-vous sûr de vouloir enregistrer cette remise de ${formData.amount} DH ? Cela n'affectera pas la caisse globale.`,
      action: executeRemise
    });
    setShowConfirmModal(true);
  };

  const executeRemise = async () => {
    try {
      await api.post(`/fournisseurs/${id}/remise`, formData);
      setShowRemiseModal(false);
      setShowConfirmModal(false);
      setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchDetails();
      showToast("Remise enregistrée avec succès.");
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de l'ajout de la remise.", "danger");
      setShowConfirmModal(false);
    }
  };

  const handlePayCheque = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/fournisseurs/history/${selectedHistory._id}/pay`, { password: adminPassword });
      setShowPayChequeModal(false);
      setAdminPassword('');
      fetchDetails();
      showToast("Chèque marqué comme payé.", "success");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Erreur lors du paiement');
    }
  };

  const handleEditHistory = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/fournisseurs/history/${selectedHistory._id}`, { ...formData });
      setShowEditHistoryModal(false);
      setAdminPassword('');
      fetchDetails();
      showToast("Historique modifié avec succès.", "success");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleDeleteHistory = async (e) => {
    e.preventDefault();
    try {
      await api.delete(`/fournisseurs/history/${selectedHistory._id}`);
      setShowDeleteHistoryModal(false);
      setAdminPassword('');
      fetchDetails();
      showToast("Historique supprimé.", "success");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const openEditModal = (h) => {
    setSelectedHistory(h);
    setFormData({ amount: h.amount, description: h.description, date: new Date(h.date).toISOString().split('T')[0] });
    setAdminPassword('');
    setErrorMsg('');
    setShowEditHistoryModal(true);
  };

  const openDeleteModal = (h) => {
    setSelectedHistory(h);
    setAdminPassword('');
    setErrorMsg('');
    setShowDeleteHistoryModal(true);
  };

  const openPayChequeModal = (h) => {
    setSelectedHistory(h);
    setAdminPassword('');
    setErrorMsg('');
    setShowPayChequeModal(true);
  };

  const generatePDF = () => {
    if (!fournisseur) return;
    const doc = new jsPDF();
    doc.addFileToVFS('amiri.ttf', amiriFont);
    doc.addFont('amiri.ttf', 'amiri', 'normal');
    const logoUrl = "/logo.jpg";

    /* ───── HEADER ───── */
    try { doc.addImage(logoUrl, "JPG", 14, 10, 25, 25); } catch (e) {}
    doc.setFont("amiri", "normal");
    doc.setFontSize(18);
    doc.text("GIL JAKAN", 45, 18);
    doc.setFontSize(10);
    doc.text("ALUMINIUM & MENUISERIE", 45, 24);
    doc.setDrawColor(200);
    doc.line(14, 35, 196, 35);

    /* ───── REPORT TITLE ───── */
    doc.setFontSize(14);
    doc.text(`Relevé de Compte Fournisseur: ${fournisseur.name}`, 14, 45);
    
    const restToPay = fournisseur.totalBought - fournisseur.totalPaid;
    doc.setFontSize(10);
    doc.text(`Contact: ${fournisseur.phone || '-'} | Email: ${fournisseur.email || '-'}`, 14, 52);

    /* ───── TRANSACTIONS TABLE ───── */
    autoTable(doc, {
      startY: 60,
      head: [["Date", "Type", "Désignation", "Montant"]],
      body: filteredHistory.map((h) => [
        new Date(h.date).toLocaleDateString("fr-FR"),
        h.type === 'purchase' ? 'Achat' : h.type === 'payment' ? 'Paiement' : h.type === 'remise' ? 'Remise' : 'Chèque',
        h.description || '-',
        `${h.amount.toLocaleString()} DH`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [240, 240, 240], textColor: 0, font: "amiri" },
      styles: { fontSize: 9, font: "amiri" },
    });

    /* ───── SUMMARY ───── */
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.text("Résumé du Compte", 140, finalY);
    
    doc.text("Total Acheté :", 120, finalY + 10);
    doc.text(`${fournisseur.totalBought.toLocaleString()} DH`, 190, finalY + 10, { align: "right" });

    doc.text("Total Payé :", 120, finalY + 18);
    doc.text(`${fournisseur.totalPaid.toLocaleString()} DH`, 190, finalY + 18, { align: "right" });

    doc.text("Reste à Payer :", 120, finalY + 28);
    doc.text(`${restToPay.toLocaleString()} DH`, 190, finalY + 28, { align: "right" });

    /* ───── FOOTER ───── */
    doc.setDrawColor(200);
    doc.line(14, 285, 196, 285);
    doc.setFontSize(8);
    doc.text("Document généré par le système de gestion GIL JAKAN", 105, 292, { align: "center" });

    doc.save(`Releve_Fournisseur_${fournisseur.name.replace(/\s+/g, '_')}.pdf`);
  };

  if (!fournisseur) return <div className="p-4 text-center">Chargement...</div>;

  const restToPay = fournisseur.totalBought - fournisseur.totalPaid;

  const availableYears = [...new Set(history.map(h => new Date(h.date).getFullYear().toString()))].sort();
  const availableMonths = [...new Set(history.map(h => (new Date(h.date).getMonth() + 1).toString()))].sort((a,b) => Number(a) - Number(b));

  const filteredHistory = history.filter(h => {
    const d = new Date(h.date);
    const hYear = d.getFullYear().toString();
    const hMonth = (d.getMonth() + 1).toString();
    
    let typeMatch = true;
    if (filterType === 'achat') typeMatch = h.type === 'purchase';
    if (filterType === 'paiement') typeMatch = (h.type === 'payment' || h.type === 'cheque' || h.type === 'remise');
    
    let yearMatch = filterYear === 'all' || filterYear === hYear;
    let monthMatch = filterMonth === 'all' || filterMonth === hMonth;
    
    return typeMatch && yearMatch && monthMatch;
  });

  return (
    <Container fluid className="py-4">
      <div className="d-flex align-items-center mb-4 gap-3">
        <Button variant="light" className="btn-icon" onClick={() => navigate('/fournisseurs')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h2 className="jakan-title m-0">{fournisseur.name}</h2>
          <div className="text-muted small mt-1 d-flex gap-3">
            {fournisseur.phone && <span>📞 {fournisseur.phone}</span>}
            {fournisseur.email && <span>✉️ {fournisseur.email}</span>}
            {fournisseur.address && <span>📍 {fournisseur.address}</span>}
          </div>
        </div>
        <div className="ms-auto d-flex gap-2">
          <Button variant="danger" className="d-flex align-items-center gap-2 fw-bold" onClick={generatePDF}>
            <FileText size={18}/> EXPORTER PDF
          </Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col md={4}>
          <div className="finance-stat-card shadow p-4" style={{ borderLeft: '4px solid #6c757d', backgroundColor: '#fff' }}>
            <div className="small fw-bold text-muted mb-1 d-flex align-items-center gap-2"><ShoppingCart size={16}/> TOTAL ACHATS</div>
            <h3 className="fw-bold m-0 text-dark">{fournisseur.totalBought.toLocaleString()} DH</h3>
          </div>
        </Col>
        <Col md={4}>
          <div className="finance-stat-card income shadow p-4">
            <div className="small fw-bold text-white opacity-75 mb-1 d-flex align-items-center gap-2"><DollarSign size={16}/> TOTAL PAYÉ</div>
            <h3 className="fw-bold m-0 text-white">{fournisseur.totalPaid.toLocaleString()} DH</h3>
          </div>
        </Col>
        <Col md={4}>
          <div className="finance-stat-card expense shadow p-4">
            <div className="small fw-bold text-white opacity-75 mb-1 d-flex align-items-center gap-2"><Truck size={16}/> RESTE À PAYER</div>
            <h3 className="fw-bold m-0 text-white">{restToPay.toLocaleString()} DH</h3>
          </div>
        </Col>
      </Row>

      <div className="d-flex justify-content-between align-items-center mb-3 mt-5">
        <h4 className="fw-bold m-0 text-dark">Historique des Opérations</h4>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" className="fw-bold" onClick={() => setShowPurchaseModal(true)}>
            + Ajouter Achat
          </Button>
          <Button variant="warning" className="fw-bold text-dark" onClick={() => setShowChequeModal(true)}>
            + Ajouter Chèque
          </Button>
          <Button variant="info" className="fw-bold text-white" onClick={() => setShowRemiseModal(true)}>
            + Ajouter Remise
          </Button>
          <Button variant="success" className="fw-bold text-white" onClick={() => setShowPaymentModal(true)}>
            + Ajouter Paiement
          </Button>
        </div>
      </div>

      <Row className="mb-3">
        <Col md={4}>
          <Form.Select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">Tous les types</option>
            <option value="achat">Achats</option>
            <option value="paiement">Paiements / Chèques / Remises</option>
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="all">Toutes les années</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="all">Tous les mois</option>
            {availableMonths.map(m => <option key={m} value={m}>Mois {m}</option>)}
          </Form.Select>
        </Col>
      </Row>

      <div className="jakan-table shadow-sm bg-body border rounded-4 overflow-hidden">
        <Table hover responsive className="m-0 align-middle">
          <thead>
            <tr>
              <th className="ps-4">Date</th>
              <th>Type</th>
              <th>Désignation</th>
              <th className="text-end pe-4">Montant</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr><td colSpan="5" className="text-center p-5 text-muted">Aucun historique trouvé pour ces filtres.</td></tr>
            ) : (
              [...filteredHistory].sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                if (dateB - dateA !== 0) return dateB - dateA;
                // If same date, use _id (newest first)
                return a._id < b._id ? 1 : -1;
              }).map(h => (
                <tr key={h._id}>
                  <td className="ps-4 fw-bold text-muted">{new Date(h.date).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <Badge bg={h.type === 'purchase' ? 'secondary' : h.type === 'payment' ? 'success' : h.type === 'remise' ? 'info' : 'warning'} className={`px-2 py-1 ${(h.type === 'cheque' || h.type === 'remise') ? 'text-dark' : ''}`}>
                      {h.type === 'purchase' ? 'ACHAT' : h.type === 'payment' ? 'PAIEMENT' : h.type === 'remise' ? 'REMISE' : 'CHÈQUE'}
                    </Badge>
                    {h.type === 'cheque' && !h.isPaid && (
                      <Badge bg="danger" className="ms-2 px-2 py-1 cursor-pointer" style={{ cursor: 'pointer' }} onClick={() => openPayChequeModal(h)}>
                        Non Payé
                      </Badge>
                    )}
                    {h.type === 'cheque' && h.isPaid && (
                      <Badge bg="success" className="ms-2 px-2 py-1">
                        Payé
                      </Badge>
                    )}
                  </td>
                  <td>{h.description || '-'}</td>
                  <td className={`text-end pe-4 fw-bold ${(h.type === 'payment' || h.type === 'remise' || (h.type === 'cheque' && h.isPaid)) ? 'text-success' : ''}`}>
                    {h.amount.toLocaleString()} DH
                  </td>
                  <td className="text-end pe-4">
                    <Button variant="link" className="p-0 text-primary me-2" onClick={() => openEditModal(h)}>
                      <Edit3 size={18} />
                    </Button>
                    <Button variant="link" className="p-0 text-danger" onClick={() => openDeleteModal(h)}>
                      <Trash2 size={18} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* Modal Purchase */}
      <Modal show={showPurchaseModal} onHide={() => setShowPurchaseModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-primary d-flex align-items-center gap-2"><ShoppingCart size={20}/> Nouvel Achat</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddPurchase}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Montant (DH) *</Form.Label>
              <Form.Control type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Désignation / Numéro Facture</Form.Label>
              <Form.Control type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">Date</Form.Label>
              <Form.Control type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </Form.Group>
            <Button type="submit" variant="primary" className="w-100 fw-bold py-2">Enregistrer L'Achat</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal Payment */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-success d-flex align-items-center gap-2"><DollarSign size={20}/> Nouveau Paiement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-info py-2 small mb-3">
            Enregistrer ce paiement déduira également ce montant de l'historique global de la caisse.
          </div>
          <Form onSubmit={handleAddPayment}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Montant (DH) *</Form.Label>
              <Form.Control type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Désignation (Espèces, Chèque N°...)</Form.Label>
              <Form.Control type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">Date</Form.Label>
              <Form.Control type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </Form.Group>
            <Button type="submit" variant="success" className="w-100 fw-bold py-2 text-white">Enregistrer Le Paiement</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal Cheque */}
      <Modal show={showChequeModal} onHide={() => setShowChequeModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-warning d-flex align-items-center gap-2"><CreditCard size={20}/> Nouveau Chèque</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-warning py-2 small mb-3 text-dark">
            Ce chèque sera enregistré comme "Non payé" et ne sera pas déduit de la caisse avant d'être marqué comme payé.
          </div>
          <Form onSubmit={(e) => { e.preventDefault(); executeCheque(); }}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Montant (DH) *</Form.Label>
              <Form.Control type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Désignation (Chèque N°...)</Form.Label>
              <Form.Control type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">Date</Form.Label>
              <Form.Control type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </Form.Group>
            <Button type="submit" variant="warning" className="w-100 fw-bold py-2 text-dark">Enregistrer Le Chèque</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal Remise */}
      <Modal show={showRemiseModal} onHide={() => setShowRemiseModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-info d-flex align-items-center gap-2"><Plus size={20}/> Nouvelle Remise</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-info py-2 small mb-3">
            Cette remise réduira le reste à payer du fournisseur sans affecter la caisse principale.
          </div>
          <Form onSubmit={handleAddRemise}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Montant (DH) *</Form.Label>
              <Form.Control type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Désignation (Ex: Geste commercial, Escompte...)</Form.Label>
              <Form.Control type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">Date</Form.Label>
              <Form.Control type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </Form.Group>
            <Button type="submit" variant="info" className="w-100 fw-bold py-2 text-white">Enregistrer La Remise</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal Edit History */}
      <Modal show={showEditHistoryModal} onHide={() => setShowEditHistoryModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-primary d-flex align-items-center gap-2"><Edit3 size={20}/> Modifier Historique</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorMsg && <div className="alert alert-danger py-2 small mb-3">{errorMsg}</div>}
          <Form onSubmit={handleEditHistory}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Montant (DH) *</Form.Label>
              <Form.Control type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Désignation</Form.Label>
              <Form.Control type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">Date</Form.Label>
              <Form.Control type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </Form.Group>
            <Button type="submit" variant="primary" className="w-100 fw-bold py-2">Enregistrer les Modifications</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal Delete History */}
      <Modal show={showDeleteHistoryModal} onHide={() => setShowDeleteHistoryModal(false)} centered size="sm">
        <Form onSubmit={handleDeleteHistory}>
          <Modal.Body className="text-center p-4">
            <div className="text-danger mb-3 mt-2">
              <Trash2 size={54} strokeWidth={1.5} />
            </div>
            <h4 className="fw-bold mb-2">Supprimer ?</h4>
            <p className="text-muted small">
              Voulez-vous vraiment supprimer cette opération ?
            </p>
            {errorMsg && <div className="alert alert-danger py-2 small mb-3">{errorMsg}</div>}
            <div className="d-grid gap-2 mt-4">
              <Button type="submit" variant="danger" className="fw-bold py-2 shadow-sm">
                OUI, SUPPRIMER
              </Button>
              <Button variant="link" className="text-muted text-decoration-none small" onClick={() => setShowDeleteHistoryModal(false)}>
                Annuler
              </Button>
            </div>
          </Modal.Body>
        </Form>
      </Modal>

      {/* Modal Pay Cheque */}
      <Modal show={showPayChequeModal} onHide={() => setShowPayChequeModal(false)} centered size="sm">
        <Form onSubmit={handlePayCheque}>
          <Modal.Body className="text-center p-4">
            <div className="text-success mb-3 mt-2">
              <CheckCircle size={54} strokeWidth={1.5} />
            </div>
            <h4 className="fw-bold mb-2 text-success">Valider Chèque</h4>
            <p className="text-muted small">
              En validant, le montant sera déduit de la caisse.
            </p>
            {errorMsg && <div className="alert alert-danger py-2 small mb-3">{errorMsg}</div>}
            <Form.Group className="mb-4 text-start">
              <Form.Label className="small fw-bold text-danger d-flex align-items-center gap-2"><Lock size={16}/> Mot de passe Admin</Form.Label>
              <Form.Control type="password" required value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
            </Form.Group>
            <div className="d-grid gap-2 mt-4">
              <Button type="submit" variant="success" className="fw-bold py-2 shadow-sm text-white">
                MARQUER COMME PAYÉ
              </Button>
              <Button variant="link" className="text-muted text-decoration-none small" onClick={() => setShowPayChequeModal(false)}>
                Annuler
              </Button>
            </div>
          </Modal.Body>
        </Form>
      </Modal>

      {/* Modal Confirm */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{confirmConfig.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-muted">
          {confirmConfig.message}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowConfirmModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={confirmConfig.action}>Confirmer</Button>
        </Modal.Footer>
      </Modal>

      {/* Toast */}
      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 1055 }}>
        <Toast show={toast.show} bg={toast.bg} delay={3000} autohide onClose={() => setToast({ ...toast, show: false })}>
          <Toast.Body className={toast.bg === 'warning' || toast.bg === 'light' ? 'text-dark fw-bold' : 'text-white fw-bold'}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

    </Container>
  );
};

export default FournisseurDetails;
