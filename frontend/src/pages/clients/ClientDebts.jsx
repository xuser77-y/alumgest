import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Modal, Form, ProgressBar, Toast, ToastContainer } from 'react-bootstrap';
import { Wallet, Plus, Search, FileText, CheckCircle, Clock, AlertTriangle, Trash2, Edit, TrendingDown } from 'lucide-react';
import api from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { amiriFont } from '../../utils/amiriFont';
import './ClientDebts.css';

const ClientDebts = () => {
  const [debts, setDebts] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [loading, setLoading] = useState(true);
  const [clientMode, setClientMode] = useState('existing'); // 'existing' or 'new'
  const [newClientData, setNewClientData] = useState({ name: '', phone: '', address: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState(null);

  // Payment edit/delete states
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [editPaymentForm, setEditPaymentForm] = useState({ amount: '', note: '', date: '' });

  // Form states
  const [editDebtForm, setEditDebtForm] = useState({ totalAmount: '', notes: '', createdAt: '' });
  const [newDebt, setNewDebt] = useState({ 
    client: '', 
    totalAmount: '', 
    notes: '', 
    createdAt: new Date().toISOString().split('T')[0] 
  });
  const [payment, setNewPayment] = useState({ amount: '', note: '', date: new Date().toISOString().split('T')[0] });

  const fetchData = async () => {
    try {
      const [resDebts, resClients] = await Promise.all([
        api.get('/debts'),
        api.get('/clients')
      ]);
      setDebts(resDebts.data);
      setClients(resClients.data);
      setLoading(false);

      // Keep active debt selected with fresh data so history updates in real-time
      setSelectedDebt(prev => {
        if (!prev) return null;
        return resDebts.data.find(d => d._id === prev._id) || prev;
      });
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddDebt = async (e) => {
    e.preventDefault();
    try {
      let clientId = newDebt.client;
      if (clientMode === 'new') {
        const res = await api.post('/clients/check', newClientData);
        clientId = res.data.client._id;
      }
      await api.post('/debts', { ...newDebt, client: clientId });
      setShowAddModal(false);
      setNewDebt({ client: '', totalAmount: '', notes: '', createdAt: new Date().toISOString().split('T')[0] });
      setNewClientData({ name: '', phone: '', address: '' });
      fetchData();
      setToast({ show: true, message: 'Dette enregistrée !', variant: 'success' });
    } catch (err) { setToast({ show: true, message: 'Erreur lors de l\'ajout', variant: 'danger' }); }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/debts/${selectedDebt._id}/payment`, payment);
      setShowPaymentModal(false);
      setNewPayment({ amount: '', note: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
      setToast({ show: true, message: 'Paiement enregistré !', variant: 'success' });
    } catch (err) { setToast({ show: true, message: 'Erreur lors du paiement', variant: 'danger' }); }
  };

  const handleDeleteClick = (id) => {
    setDebtToDelete(id);
    setShowDeleteModal(true);
  };

  const handleEditClick = (debt) => {
    setSelectedDebt(debt);
    setEditDebtForm({
      totalAmount: debt.totalAmount,
      notes: debt.notes || '',
      createdAt: new Date(debt.createdAt).toISOString().split('T')[0]
    });
    setShowEditModal(true);
  };

  const handleUpdateDebt = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/debts/${selectedDebt._id}`, editDebtForm);
      setShowEditModal(false);
      fetchData();
      setToast({ show: true, message: 'Dette modifiée avec succès', variant: 'success' });
    } catch (err) {
      setToast({ show: true, message: 'Erreur lors de la modification', variant: 'danger' });
    }
  };

  const confirmDeleteDebt = async () => {
    try {
      await api.delete(`/debts/${debtToDelete}`);
      setShowDeleteModal(false);
      setDebtToDelete(null);
      fetchData();
      setToast({ show: true, message: 'Dette supprimée avec succès', variant: 'success' });
    } catch (err) { 
        console.error(err);
        setToast({ show: true, message: 'Erreur lors de la suppression', variant: 'danger' });
    }
  };

  const handleEditPaymentClick = (payment) => {
    setSelectedPayment(payment);
    setEditPaymentForm({
      amount: payment.amount,
      note: payment.note || '',
      date: new Date(payment.date).toISOString().split('T')[0]
    });
    setShowEditPaymentModal(true);
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/debts/${selectedDebt._id}/payment/${selectedPayment._id}`, editPaymentForm);
      setShowEditPaymentModal(false);
      setSelectedPayment(null);
      fetchData();
      setToast({ show: true, message: 'Paiement modifié avec succès', variant: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Erreur lors de la modification du paiement', variant: 'danger' });
    }
  };

  const handleDeletePaymentClick = (payment) => {
    setSelectedPayment(payment);
    setShowDeletePaymentModal(true);
  };

  const confirmDeletePayment = async () => {
    try {
      await api.delete(`/debts/${selectedDebt._id}/payment/${selectedPayment._id}`);
      setShowDeletePaymentModal(false);
      setSelectedPayment(null);
      fetchData();
      setToast({ show: true, message: 'Paiement supprimé avec succès', variant: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Erreur lors de la suppression du paiement', variant: 'danger' });
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.addFileToVFS('amiri.ttf', amiriFont);
    doc.addFont('amiri.ttf', 'amiri', 'normal');
    doc.setFont("amiri", "normal");

    // Header
    try { doc.addImage('/logo.jpg', 'JPG', 14, 10, 25, 25); } catch(e){}
    doc.setFontSize(18);
    doc.text("GIL JAKAN", 45, 18);
    doc.setFontSize(10);
    doc.text("ALUMINIUM & MENUISERIE", 45, 24);
    doc.setDrawColor(200);
    doc.line(14, 35, 196, 35);

    // Title
    doc.setFontSize(14);
    doc.text("ÉTAT DES CRÉANCES CLIENTS (DETTES)", 14, 45);
    doc.setFontSize(10);
    doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 14, 52);

    // Only show pending debts
    const pendingDebts = debts.filter(d => {
      const totalPaid = d.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      return (d.totalAmount - totalPaid) > 0;
    });

    const formatNum = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    autoTable(doc, {
      startY: 60,
      head: [['Client', 'Contact', 'Dette Totale', 'Déjà Payé', 'Reste à Payer']],
      body: pendingDebts.map(d => {
        const paid = d.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        return [
          d.client?.name || 'Inconnu',
          d.client?.phone || '-',
          `${formatNum(d.totalAmount)} DH`,
          `${formatNum(paid)} DH`,
          `${formatNum(d.totalAmount - paid)} DH`
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: 0, font: 'amiri' },
      styles: { fontSize: 9, font: 'amiri' }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    const grandTotal = pendingDebts.reduce((sum, d) => {
        const paid = d.payments?.reduce((s, p) => s + p.amount, 0) || 0;
        return sum + (d.totalAmount - paid);
    }, 0);

    doc.setFontSize(12);
    doc.text("RÉSUMÉ GLOBAL", 140, finalY);
    doc.setFontSize(10);
    doc.text(`Nombre de dossiers : ${pendingDebts.length}`, 120, finalY + 10);
    doc.setFontSize(13);
    doc.setFont("amiri", "bold");
    doc.text(`TOTAL À RÉCUPÉRER :   ${formatNum(grandTotal)} DH`, 120, finalY + 20);

    // Footer
    doc.setDrawColor(200);
    doc.line(14, 285, 196, 285);
    doc.setFontSize(8);
    doc.text("Document généré par le système de gestion GIL JAKAN", 105, 292, { align: "center" });

    doc.save(`Etat_Dettes_Clients_${new Date().toLocaleDateString('fr-FR')}.pdf`);
  };

  const filteredDebts = debts.filter(d => 
    d.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.client?.phone.includes(searchTerm)
  );

  // ── SUMMARY CALCULATIONS ──
  const totalDebts     = debts.reduce((sum, d) => sum + (d.totalAmount || 0), 0);
  const totalCollected = debts.reduce((sum, d) => {
    const paid = d.payments?.reduce((s, p) => s + (p.amount || 0), 0) || 0;
    return sum + paid;
  }, 0);
  const totalRemaining = totalDebts - totalCollected;

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="jakan-title m-0">DETTES <span className="text-jakan">CLIENTS</span></h2>
          <p className="text-muted small">Gestion des impayés et suivi des recouvrements.</p>
        </div>
        <div className="d-flex gap-2">
            <Button variant="outline-primary" className="fw-bold" onClick={generatePDF}>
                <FileText size={18} className="me-2"/> EXPORTER PDF
            </Button>
            <Button variant="primary" className="fw-bold" onClick={() => setShowAddModal(true)}>
                <Plus size={18} className="me-2"/> AJOUTER DETTE
            </Button>
        </div>
      </div>

      {/* ── SUMMARY STRIP ── */}
      <Row className="mb-4 g-3">
        <Col md={4}>
            <div className="summary-box-jakan blue">
                <div className="label">TOTAL DES DETTES</div>
                <div className="value">{totalDebts.toLocaleString()} DH</div>
                <div className="sub">{debts.length} dossiers</div>
            </div>
        </Col>
        <Col md={4}>
            <div className="summary-box-jakan green">
                <div className="label">DÉJÀ ENCAISSÉ</div>
                <div className="value">{totalCollected.toLocaleString()} DH</div>
                <div className="sub text-success">Recouvrement actif</div>
            </div>
        </Col>
        <Col md={4}>
            <div className="summary-box-jakan red">
                <div className="label">RESTE À RÉCUPÉRER</div>
                <div className="value">{totalRemaining.toLocaleString()} DH</div>
                <div className="sub text-danger">Alerte trésorerie</div>
            </div>
        </Col>
      </Row>

      <Card className="jakan-card border-0 shadow-sm mb-4">
        <Card.Body className="p-3">
            <div className="search-wrapper border-0 bg-light rounded-3 px-3 py-2 d-flex align-items-center">
                <Search size={18} className="text-muted me-2" />
                <Form.Control 
                    placeholder="Rechercher un client..." 
                    className="border-0 bg-transparent"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </Card.Body>
      </Card>

      <Row className="g-4">
        {filteredDebts.map(debt => {
          const paid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
          const remaining = debt.totalAmount - paid;
          const progress = Math.min(100, (paid / debt.totalAmount) * 100);
          
          return (
            <Col lg={4} md={6} key={debt._id}>
              <Card className={`client-debt-card shadow-sm h-100 ${remaining > 0 ? 'border-start border-danger border-4' : 'border-start border-success border-4'}`}>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between mb-3">
                    <h5 className="jakan-title m-0 fs-4">{debt.client?.name}</h5>
                    {remaining > 0 ? (
                      <Badge bg="danger" className="px-2 py-1">EN ATTENTE</Badge>
                    ) : (
                      <Badge bg="success" className="px-2 py-1">PAYÉ</Badge>
                    )}
                  </div>
                  
                  <div className="text-muted small mb-3">
                    <Clock size={12} className="me-1"/> Ajouté le {new Date(debt.createdAt).toLocaleDateString()}
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between small fw-bold mb-1">
                      <span className="text-muted">Recouvrement</span>
                      <span className="text-title">{Math.round(progress)}%</span>
                    </div>
                    <ProgressBar now={progress} variant={remaining > 0 ? "danger" : "success"} style={{height: 8}} className="rounded-pill shadow-inner" />
                  </div>

                  <Row className="g-2 text-center mb-4">
                    <Col xs={6}>
                      <div className="p-2 rounded-3 border bg-opacity-10" style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderColor: 'var(--border-color)' }}>
                        <div className="x-small text-muted fw-bold opacity-75">TOTAL</div>
                        <div className="fw-bold text-title">{debt.totalAmount} DH</div>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="p-2 rounded-3 border bg-opacity-10" style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderColor: 'var(--border-color)' }}>
                        <div className="x-small text-muted fw-bold opacity-75">RESTE</div>
                        <div className={`fw-bold ${remaining > 0 ? 'text-danger' : 'text-success'}`}>{remaining} DH</div>
                      </div>
                    </Col>
                  </Row>

                  <div className="d-flex gap-2">
                    <Button variant="jakan-light" className="flex-grow-1 fw-bold shadow-sm" onClick={() => { setSelectedDebt(debt); setShowPaymentModal(true); }}>
                        ENCAISSER
                    </Button>
                    <Button variant="outline-secondary" size="sm" className="px-2" onClick={() => { setSelectedDebt(debt); setShowHistoryModal(true); }}>
                        <Clock size={16}/>
                    </Button>
                    <Button variant="outline-primary" size="sm" className="px-2" onClick={() => handleEditClick(debt)}>
                        <Edit size={16}/>
                    </Button>
                    <Button variant="outline-danger" size="sm" className="px-2 border-0 bg-danger bg-opacity-10" onClick={() => handleDeleteClick(debt._id)}>
                        <Trash2 size={16} className="text-danger"/>
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* ADD DEBT MODAL */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="jakan-title">Nouvelle Dette</Modal.Title></Modal.Header>
        <Form onSubmit={handleAddDebt}>
          <Modal.Body className="p-4">
            {/* CLIENT TYPE TOGGLE */}
            <div className="d-flex gap-2 mb-4 bg-light p-1 rounded-3" style={{ width: 'fit-content' }}>
                <Button 
                    variant={clientMode === 'existing' ? 'primary' : 'light'} 
                    size="sm" className="fw-bold px-3"
                    onClick={() => setClientMode('existing')}
                >ANCIEN CLIENT</Button>
                <Button 
                    variant={clientMode === 'new' ? 'primary' : 'light'} 
                    size="sm" className="fw-bold px-3"
                    onClick={() => setClientMode('new')}
                >NOUVEAU CLIENT</Button>
            </div>

            {clientMode === 'existing' ? (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">SÉLECTIONNER CLIENT</Form.Label>
                <Form.Select required onChange={e => setNewDebt({...newDebt, client: e.target.value})}>
                  <option value="">Choisir...</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone || 'Pas de tél'})</option>)}
                </Form.Select>
              </Form.Group>
            ) : (
              <div className="p-3 border rounded-3 bg-light bg-opacity-10 mb-3">
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Label className="x-small fw-bold text-muted">NOM COMPLET</Form.Label>
                    <Form.Control required onChange={e => setNewClientData({...newClientData, name: e.target.value})} />
                  </Col>
                  <Col md={6}>
                    <Form.Label className="x-small fw-bold text-muted">TÉLÉPHONE</Form.Label>
                    <Form.Control onChange={e => setNewClientData({...newClientData, phone: e.target.value})} />
                  </Col>
                </Row>
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">MONTANT TOTAL DE LA DETTE (DH)</Form.Label>
              <Form.Control type="number" required onChange={e => setNewDebt({...newDebt, totalAmount: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">DATE DE LA DETTE</Form.Label>
              <Form.Control type="date" value={newDebt.createdAt} onChange={e => setNewDebt({...newDebt, createdAt: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">NOTES / COMMENTAIRES</Form.Label>
              <Form.Control as="textarea" rows={2} onChange={e => setNewDebt({...newDebt, notes: e.target.value})} placeholder="Ex: Reliquat projet villa..." />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowAddModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit" className="fw-bold px-4">ENREGISTRER</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* PAYMENT MODAL */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton><Modal.Title className="jakan-title text-success">Encaisser Paiement</Modal.Title></Modal.Header>
        <Form onSubmit={handleAddPayment}>
          <Modal.Body>
            <div className="text-center mb-4 p-3 bg-light rounded-3 border">
                <div className="text-muted small fw-bold">RESTE À PAYER POUR {selectedDebt?.client?.name}</div>
                <div className="fs-2 fw-bold text-jakan">
                    {selectedDebt && (selectedDebt.totalAmount - selectedDebt.payments.reduce((s,p)=>s+p.amount,0))} DH
                </div>
            </div>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Montant Reçu (DH)</Form.Label>
              <Form.Control type="number" required onChange={e => setNewPayment({...payment, amount: e.target.value})} autoFocus />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Date</Form.Label>
              <Form.Control type="date" value={payment.date} onChange={e => setNewPayment({...payment, date: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Note</Form.Label>
              <Form.Control type="text" onChange={e => setNewPayment({...payment, note: e.target.value})} placeholder="Ex: Chèque, Espèces..." />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowPaymentModal(false)}>Annuler</Button>
            <Button variant="success" type="submit" className="fw-bold px-4 shadow">VALIDER LE PAIEMENT</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* HISTORY MODAL */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} centered size="md">
        <Modal.Header closeButton><Modal.Title className="jakan-title">Historique des Paiements</Modal.Title></Modal.Header>
        <Modal.Body className="p-4">
            <div className="text-center mb-4">
                <h5 className="fw-bold mb-1">{selectedDebt?.client?.name}</h5>
                <Badge bg="primary" className="px-3">Dette Initiale: {selectedDebt?.totalAmount} DH</Badge>
            </div>

            {selectedDebt?.payments && selectedDebt.payments.length > 0 ? (
                <div className="history-list">
                    {[...selectedDebt.payments]
                        .map((p, i) => ({...p, index: i}))
                        .sort((a, b) => {
                          const dateDiff = new Date(b.date) - new Date(a.date);
                          if (dateDiff !== 0) return dateDiff;
                          return b.index - a.index;
                        })
                        .map((p, i) => (
                        <div key={i} className="d-flex justify-content-between align-items-center p-3 border rounded-3 mb-2 bg-light bg-opacity-25">
                            <div>
                                <div className="fw-bold text-success">+{p.amount} DH</div>
                                <div className="x-small text-muted">{new Date(p.date).toLocaleDateString('fr-FR')}</div>
                                <div className="small text-muted italic">{p.note || 'Paiement direct'}</div>
                            </div>
                            <div className="d-flex gap-2">
                                <Button variant="outline-primary" size="sm" className="px-2 py-1" onClick={() => handleEditPaymentClick(p)}>
                                    <Edit size={14} />
                                </Button>
                                <Button variant="outline-danger" size="sm" className="px-2 py-1 border-0 bg-danger bg-opacity-10 text-danger" onClick={() => handleDeletePaymentClick(p)}>
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <div className="mt-4 p-3 bg-jakan bg-opacity-10 rounded-3 text-center border border-primary border-opacity-25">
                        <div className="small fw-bold text-muted">TOTAL RÉCUPÉRÉ</div>
                        <div className="fs-4 fw-bold text-jakan">
                            {selectedDebt.payments.reduce((s,p)=>s+p.amount, 0)} DH
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-4 text-muted">
                    <TrendingDown size={40} className="mb-2 opacity-25"/>
                    <p>Aucun paiement enregistré pour le moment.</p>
                </div>
            )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" className="w-100 fw-bold" onClick={() => setShowHistoryModal(false)}>FERMER</Button>
        </Modal.Footer>
      </Modal>

      {/* EDIT DEBT MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="md">
        <Modal.Header closeButton><Modal.Title className="jakan-title">Modifier Dette</Modal.Title></Modal.Header>
        <Form onSubmit={handleUpdateDebt}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Nouveau Montant Total (DH)</Form.Label>
              <Form.Control type="number" required value={editDebtForm.totalAmount} onChange={e => setEditDebtForm({...editDebtForm, totalAmount: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Date de la Dette</Form.Label>
              <Form.Control type="date" required value={editDebtForm.createdAt} onChange={e => setEditDebtForm({...editDebtForm, createdAt: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Notes / Commentaires</Form.Label>
              <Form.Control as="textarea" rows={2} value={editDebtForm.notes} onChange={e => setEditDebtForm({...editDebtForm, notes: e.target.value})} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowEditModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit" className="fw-bold px-4">ENREGISTRER</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
        <Modal.Body className="p-4 text-center">
            <AlertTriangle size={50} className="text-danger mb-3" />
            <h4 className="fw-bold">Supprimer ?</h4>
            <p className="small text-muted">Voulez-vous vraiment supprimer cette dette ? Cette action est irréversible et supprimera également toutes les traces d'encaissement associées dans la caisse principale.</p>
            <div className="d-grid gap-2 mt-4">
                <Button variant="danger" className="fw-bold py-2" onClick={confirmDeleteDebt}>OUI, SUPPRIMER</Button>
                <Button variant="light" className="fw-bold text-muted" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
            </div>
        </Modal.Body>
      </Modal>

      {/* EDIT PAYMENT MODAL */}
      <Modal show={showEditPaymentModal} onHide={() => { setShowEditPaymentModal(false); setSelectedPayment(null); }} centered size="md">
        <Modal.Header closeButton><Modal.Title className="jakan-title">Modifier Paiement</Modal.Title></Modal.Header>
        <Form onSubmit={handleUpdatePayment}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Montant (DH)</Form.Label>
              <Form.Control type="number" required value={editPaymentForm.amount} onChange={e => setEditPaymentForm({...editPaymentForm, amount: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Date</Form.Label>
              <Form.Control type="date" required value={editPaymentForm.date} onChange={e => setEditPaymentForm({...editPaymentForm, date: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Note</Form.Label>
              <Form.Control type="text" value={editPaymentForm.note} onChange={e => setEditPaymentForm({...editPaymentForm, note: e.target.value})} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => { setShowEditPaymentModal(false); setSelectedPayment(null); }}>Annuler</Button>
            <Button variant="primary" type="submit" className="fw-bold px-4">ENREGISTRER</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* DELETE PAYMENT CONFIRMATION MODAL */}
      <Modal show={showDeletePaymentModal} onHide={() => { setShowDeletePaymentModal(false); setSelectedPayment(null); }} centered size="sm">
        <Modal.Body className="p-4 text-center">
            <AlertTriangle size={50} className="text-danger mb-3" />
            <h4 className="fw-bold">Supprimer le paiement ?</h4>
            <p className="small text-muted">Voulez-vous vraiment supprimer ce paiement de {selectedPayment?.amount} DH ? Cette action supprimera également ce montant de la caisse principale.</p>
            <div className="d-grid gap-2 mt-4">
                <Button variant="danger" className="fw-bold py-2" onClick={confirmDeletePayment}>OUI, SUPPRIMER</Button>
                <Button variant="light" className="fw-bold text-muted" onClick={() => { setShowDeletePaymentModal(false); setSelectedPayment(null); }}>Annuler</Button>
            </div>
        </Modal.Body>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast show={toast.show} autohide delay={3000} onClose={() => setToast({...toast, show:false})} bg={toast.variant} className="text-white border-0 shadow">
          <Toast.Body className="fw-bold d-flex align-items-center gap-2">
            <CheckCircle size={18}/> {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default ClientDebts;
