import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Modal, Form, Toast, ToastContainer } from 'react-bootstrap';
import { 
  ArrowLeft, Plus, User, Clock, Trash2, Send, 
  CheckCircle, FileText, Edit3, Wallet, 
  AlertTriangle, Settings, PlusCircle, XCircle, Search, DollarSign 
} from 'lucide-react';
import api from '../../services/api';
import './Projects.css';
import './ProjectDetails.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── DATA STATES ──
  const [project, setProject] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [projectPayments, setProjectPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── UI STATES ──
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [showPDFOptions, setShowPDFOptions] = useState(false);

  // ── FORM STATES ──
  const [editingItemId, setEditingItemId] = useState(null);
  const [includePricesInPDF, setIncludePricesInPDF] = useState(true);
  
  const [newItem, setNewItem] = useState({ label: '', width: '', height: '', quantity: 1, unitPrice: 0 });
  const [payment, setPayment] = useState({ amount: '', description: 'Tranche de paiement' });
  const [newExpense, setNewExpense] = useState({ amount: '', category: 'Matériaux', description: '' });
  const [editProjectData, setEditProjectData] = useState({ projectName: '', totalPrice: '', deadline: '' });

  // ── FETCH DATA ──
  const fetchData = async () => {
    try {
      const [resProj, resExp, resCats, resCatalog, resPays] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/expenses`),
        api.get('/categories'),
        api.get('/catalog'),
        api.get(`/transactions?projectId=${id}&type=plus`)
      ]);
      
      setProject(resProj.data);
      setExpenses(resExp.data);
      setCategories(resCats.data);
      setCatalog(resCatalog.data);
      setProjectPayments(resPays.data);
      
      setEditProjectData({ 
        projectName: resProj.data.projectName, 
        totalPrice: resProj.data.totalPrice,
        deadline: resProj.data.deadline ? resProj.data.deadline.split('T')[0] : ''
      });
      
      setLoading(false);
    } catch (err) { 
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  // ── CALCULATIONS ──
  const totalSpent = expenses?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;
  const collected = project?.advancePayment || 0;
  const remaining = project ? (Number(project.totalPrice) - Number(collected)) : 0;
  const beneficeFinalEstime = project ? (Number(project.totalPrice) - totalSpent) : 0;
  const cashEnPoche = collected - totalSpent; 
  
  const isFinished = project?.status === 'completed';

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { timeZone: 'UTC' });
  };

  // ── PROJECT HANDLERS ──
  const handleDeleteProject = async () => {
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects/active');
    } catch (err) {
      setToast({ show: true, message: 'Erreur lors de la suppression', variant: 'danger' });
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/projects/${id}`, editProjectData);
      setShowEditProjectModal(false);
      fetchData();
      setToast({ show: true, message: 'Infos mises à jour !', variant: 'success' });
    } catch (err) { alert("Erreur update"); }
  };

  const handleFinishProject = async () => {
    try {
        await api.post(`/projects/${id}/complete`, { finalSpent: totalSpent });
        setShowCompleteModal(false);
        fetchData();
        setToast({ show: true, message: 'Chantier clôturé !', variant: 'success' });
    } catch (err) { alert("Erreur"); }
  };

  // ── ITEM HANDLERS ──
  const handleOpenItemModal = (item = null) => {
    if (item) {
      setEditingItemId(item._id);
      setNewItem({ ...item });
    } else {
      setEditingItemId(null);
      setNewItem({ label: '', width: '', height: '', quantity: 1, unitPrice: 0 });
    }
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItemId) await api.put(`/projects/${id}/tasks/${editingItemId}`, newItem);
      else await api.post(`/projects/${id}/tasks`, newItem);
      setShowItemModal(false);
      fetchData();
      setToast({ show: true, message: 'Élément enregistré !', variant: 'success' });
    } catch (err) { alert("Erreur"); }
  };

  const handleDeleteItem = async (taskId) => {
    if(window.confirm("Supprimer cet élément ?")) {
      await api.delete(`/projects/${id}/tasks/${taskId}`);
      fetchData();
      setToast({ show: true, message: 'Supprimé', variant: 'danger' });
    }
  };

  // ── FINANCE HANDLERS ──
  const handleLogExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transactions', { ...newExpense, type: 'minus', projectId: id, isSettled: true });
      setShowExpenseModal(false);
      setNewExpense({ amount: '', category: 'Matériaux', description: '' });
      fetchData();
      setToast({ show: true, message: 'Dépense enregistrée', variant: 'success' });
    } catch (err) { alert("Erreur expense"); }
  };

  const handleAddAdvance = async () => {
    try {
      await api.post(`/projects/${id}/advance`, { amount: payment.amount, description: payment.description });
      setShowPayModal(false);
      setPayment({ amount: '', description: 'Versement Client' });
      fetchData();
      setToast({ show: true, message: 'Paiement client ajouté !', variant: 'success' });
    } catch (err) { alert("Erreur"); }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/projects/${id}/tasks/${taskId}`, { status: newStatus });
      fetchData();
    } catch (err) { console.error(err); }
  };

  // ── PDF GENERATOR (WITH FIRST PAYMENT LOGIC) ──
const generateClientPDF = () => {
  const doc = new jsPDF();
  const logoUrl = '/logo.jpg';

  /* ───── HEADER ───── */
  try {
    doc.addImage(logoUrl, 'JPG', 14, 10, 25, 25);
  } catch (e) {}

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("GIL JAKAN", 45, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("ALUMINIUM & MENUISERIE", 45, 24);

  doc.setDrawColor(200);
  doc.line(14, 35, 196, 35);

  /* ───── PROJECT INFO ───── */

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CHANTIER :", 14, 45);
  doc.text("CLIENT :", 14, 52);

  doc.setFont("helvetica", "normal");
  doc.text(project.projectName.toUpperCase(), 45, 45);
  doc.text(project.client.name.toUpperCase(), 45, 52);

  /* ───── ITEMS TABLE ───── */

  const head = includePricesInPDF
    ? [['Désignation', 'Dimensions', 'Qté', 'Prix U', 'Total']]
    : [['Désignation', 'Dimensions', 'Qté']];

  const body = project.items.map(i =>
    includePricesInPDF
      ? [
          i.label,
          `${i.width || 0} x ${i.height || 0}`,
          i.quantity,
          `${i.unitPrice} DH`,
          `${i.totalPrice} DH`
        ]
      : [
          i.label,
          `${i.width || 0} x ${i.height || 0}`,
          i.quantity
        ]
  );

  autoTable(doc, {
    startY: 60,
    head,
    body,
    theme: "grid",
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: 0
    },
    styles: {
      fontSize: 9
    }
  });

  /* ───── PAYMENT HISTORY ───── */

  let finalY = doc.lastAutoTable.finalY + 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Historique des paiements", 14, finalY);

  const payRows = projectPayments.map(p => [
    new Date(p.date).toLocaleDateString(),
    p.description,
    `${p.amount} DH`
  ]);

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Date', 'Détail du versement', 'Montant']],
    body: payRows,
    theme: "grid",
    styles: { fontSize: 9 }
  });

  /* ───── SUMMARY ───── */

  finalY = doc.lastAutoTable.finalY + 15;

  doc.setFont("helvetica", "bold");
  doc.text("Récapitulatif", 140, finalY);

  doc.setFont("helvetica", "normal");
  doc.text("Budget total :", 120, finalY + 10);
  doc.text(`${project.totalPrice} DH`, 190, finalY + 10, { align: "right" });

  doc.text("Total réglé :", 120, finalY + 18);
  doc.text(`${project.advancePayment} DH`, 190, finalY + 18, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.text("Reste à payer :", 120, finalY + 28);
  doc.text(`${remaining} DH`, 190, finalY + 28, { align: "right" });

  /* ───── FOOTER ───── */

  doc.setDrawColor(200);
  doc.line(14, 285, 196, 285);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Document généré par le système de gestion GIL JAKAN", 105, 292, { align: "center" });

  doc.save(`Fiche_${project.projectName}.pdf`);
};

  if (loading || !project) return <div className="vh-100 d-flex align-items-center justify-content-center jakan-title text-muted">Accès au dossier en cours...</div>;

  return (
    <Container fluid className="py-4">
      {/* ── TOP NAV BAR ── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button variant="link" onClick={() => navigate(-1)} className="text-jakan p-0 text-decoration-none fw-bold d-flex align-items-center">
            <ArrowLeft size={22} className="me-2"/> RETOUR
          </Button>
          {!isFinished && <Button variant="outline-danger" size="sm" className="border-0 opacity-50" onClick={() => setShowDeleteProjectModal(true)}><Trash2 size={20}/></Button>}
        </div>
        <div className="d-flex gap-2">
            <Button variant="danger" onClick={() => setShowPDFOptions(true)} className="fw-bold px-3 btn-sm shadow-sm"><FileText size={18} className="me-2" /> PDF CLIENT</Button>
            {!isFinished && (
                <>
                  <Button variant="warning" className="fw-bold text-dark px-3 btn-sm shadow-sm" onClick={() => setShowExpenseModal(true)}>LOG DÉPENSE</Button>
                  <Button variant="success" className="fw-bold px-3 btn-sm shadow-sm" onClick={() => setShowCompleteModal(true)}>CLÔTURER</Button>
                </>
            )}
        </div>
      </div>

      {/* ── SUMMARY STRIP ── */}
      <div className="summary-strip-jakan mb-5">
        <div className="ss-box blue"><div className="ss-lbl">Valeur Chantier</div><div className="ss-val">{project.totalPrice.toLocaleString()} DH</div></div>
        <div className="ss-box green"><div className="ss-lbl">Déjà Encaissé</div><div className="ss-val">{collected.toLocaleString()} DH</div></div>
        <div className="ss-box red"><div className="ss-lbl">Dépenses (Achats)</div><div className="ss-val">{totalSpent.toLocaleString()} DH</div></div>
        <div className="ss-box amber"><div className="ss-lbl">Reste Client</div><div className="ss-val">{remaining.toLocaleString()} DH</div></div>
        <div className="ss-box"><div className="ss-lbl">Éléments</div><div className="ss-val">{project.items.length}</div></div>
      </div>

      <Row className="g-4">
        <Col lg={8}>
          <div className="mb-4 d-flex justify-content-between align-items-start">
            <div>
              <h1 className="jakan-title display-5 m-0 text-title">{project.projectName}</h1>
              <div className="text-muted small fw-bold mt-1">
                <User size={14} className="text-jakan me-1"/> {project.client?.name} | <Clock size={14} className="ms-2"/> Livraison: {formatDate(project.deadline)}
              </div>
            </div>
            {!isFinished && <Button variant="link" className="text-muted p-0" onClick={() => setShowEditProjectModal(true)}><Settings size={22}/></Button>}
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
            <h5 className="jakan-title m-0 opacity-75">LISTE DES ÉLÉMENTS ({project.items.length})</h5>
            {!isFinished && <Button variant="primary" size="sm" onClick={() => handleOpenItemModal()} className="fw-bold shadow">+ AJOUTER ÉLÉMENT</Button>}
          </div>

          <div className="tasks-grid">
            {project.items.length === 0 ? (
                <div className="text-center p-5 border border-dashed rounded-4 text-muted bg-light bg-opacity-10">Aucun élément dans ce chantier.</div>
            ) : project.items.map((item) => (
              <div key={item._id} className="task-row-jakan d-flex align-items-center justify-content-between shadow-sm bg-body">
                <div>
                  <div className="fw-bold fs-5 text-title">{item.label}</div>
                  <div className="x-small text-muted fw-bold">{item.width||0}x{item.height||0}cm · Qté: {item.quantity} · <span className="text-jakan">{item.totalPrice.toLocaleString()} DH</span></div>
                </div>
                {!isFinished && (
                  <div className="d-flex gap-1 border-start ps-3">
                    <Button variant="link" className="text-primary p-1" onClick={() => handleOpenItemModal(item)}><Edit3 size={18}/></Button>
                    <Button variant="link" className="text-danger p-1" onClick={() => handleDeleteItem(item._id)}><Trash2 size={18}/></Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Col>

        {/* ── FINANCE TOWER ── */}
        <Col lg={4}>
          <div className="finance-tower p-4 shadow-lg sticky-top">
             <h6 className="fw-bold mb-4 opacity-75 uppercase small text-white text-center">Trésorerie du Projet</h6>
             <div className="d-flex justify-content-between align-items-center mb-4 text-white">
                <div><div className="x-small opacity-75">RESTE À ENCAISSER CLIENT</div><h2 className="fw-bold m-0 fs-1">{remaining.toLocaleString()} DH</h2></div>
                <Button variant="dark" size="sm" className="rounded-circle shadow-sm" onClick={() => setShowPayModal(true)}><Plus size={20}/></Button>
             </div>
             <div className="p-3 bg-white-10 rounded-4 border border-white border-opacity-10 mb-4 text-white">
                <div className="d-flex justify-content-between small mb-2"><span>Prix Vendu</span><span className="fw-bold">{project.totalPrice.toLocaleString()} DH</span></div>
                <div className="d-flex justify-content-between small mb-2 text-info"><span>Encaissé (+)</span><span className="fw-bold">{collected.toLocaleString()} DH</span></div>
                <div className="d-flex justify-content-between small text-danger"><span>Dépenses (-)</span><span className="fw-bold">-{totalSpent.toLocaleString()} DH</span></div>
             </div>
             <div className={`p-4 rounded-4 text-center profit-box text-white`}>
                <div className="x-small fw-bold opacity-75">BÉNÉFICE RÉEL ACTUEL</div>
                <div className="display-6 fw-bold">{cashEnPoche.toLocaleString()} DH</div>
             </div>
             {isFinished && remaining > 0 && <div className="mt-4 alert alert-danger border-0 d-flex align-items-center gap-2 small fw-bold shadow"><AlertTriangle size={18}/> CLIENT DOIT ENCORE {remaining.toLocaleString()} DH</div>}
          </div>
        </Col>
      </Row>

      {/* ── ALL MODALS ── */}

      <Modal show={showItemModal} onHide={() => setShowItemModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold">{editingItemId ? 'Modifier' : 'Ajouter'} Élément</Modal.Title></Modal.Header>
        <Form onSubmit={handleSaveItem}>
          <Modal.Body className="p-4 pt-0 text-dark">
            <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted uppercase">Désignation (Catalogue / Libre)</Form.Label>
                <Form.Control list="cat-list" required value={newItem.label} onChange={e => {
                    const sel = catalog.find(x => x.name === e.target.value);
                    setNewItem({...newItem, label: e.target.value, unitPrice: sel ? sel.basePrice : newItem.unitPrice });
                }} />
                <datalist id="cat-list">{catalog.map(c => <option key={c._id} value={c.name} />)}</datalist>
            </Form.Group>
            <Row className="g-3">
              <Col md={6}><Form.Label className="small fw-bold">Prix Unitaire (DH)</Form.Label><Form.Control type="number" required value={newItem.unitPrice} onChange={e => setNewItem({...newItem, unitPrice: e.target.value})}/></Col>
              <Col md={6}><Form.Label className="small fw-bold">Quantité</Form.Label><Form.Control type="number" required value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})}/></Col>
              <Col md={6}><Form.Label className="small fw-bold">Largeur (cm)</Form.Label><Form.Control type="number" value={newItem.width} onChange={e => setNewItem({...newItem, width: e.target.value})}/></Col>
              <Col md={6}><Form.Label className="small fw-bold">Hauteur (cm)</Form.Label><Form.Control type="number" value={newItem.height} onChange={e => setNewItem({...newItem, height: e.target.value})}/></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0"><Button variant="primary" type="submit" className="w-100 fw-bold shadow">{editingItemId ? 'METTRE À JOUR' : 'VALIDER L\'ÉLÉMENT'}</Button></Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showPDFOptions} onHide={() => setShowPDFOptions(false)} centered size="sm">
          <Modal.Body className="p-4 text-center text-dark">
              <h5 className="fw-bold mb-3">Exportation PDF</h5>
              <Form.Check type="checkbox" label="Inclure les prix détaillés" checked={includePricesInPDF} onChange={e => setIncludePricesInPDF(e.target.checked)} className="mb-4 text-start fw-bold" />
              <Button variant="danger" className="w-100 fw-bold shadow" onClick={() => { generateClientPDF(); setShowPDFOptions(false); }}>TÉLÉCHARGER</Button>
          </Modal.Body>
      </Modal>

      <Modal show={showCompleteModal} onHide={() => setShowCompleteModal(false)} centered size="sm">
        <Modal.Body className="p-4 text-center text-dark">
            <CheckCircle size={50} className="text-success mb-3" />
            <h4 className="jakan-title">Clôturer ?</h4>
            <p className="small text-muted">Bénéfice estimé: <b>{beneficeFinalEstime.toLocaleString()} DH</b>. Une fois clôturé, les élèments seront verrouillés.</p>
            <div className="d-grid gap-2 mt-4">
                <Button variant="success" className="fw-bold py-2 shadow" onClick={handleFinishProject}>CONFIRMER LA CLÔTURE</Button>
                <Button variant="light" className="small" onClick={() => setShowCompleteModal(false)}>Annuler</Button>
            </div>
        </Modal.Body>
      </Modal>

      <Modal show={showDeleteProjectModal} onHide={() => setShowDeleteProjectModal(false)} centered size="sm">
        <Modal.Body className="p-4 text-center text-dark">
            <AlertTriangle size={50} className="text-danger mb-3" />
            <h4 className="fw-bold">Supprimer ?</h4>
            <p className="small text-muted">Toutes les données du projet seront perdues.</p>
            <div className="d-grid gap-2 mt-4"><Button variant="danger" className="fw-bold" onClick={handleDeleteProject}>OUI, SUPPRIMER</Button><Button variant="light" onClick={() => setShowDeleteProjectModal(false)}>Annuler</Button></div>
        </Modal.Body>
      </Modal>

      <Modal show={showPayModal} onHide={() => setShowPayModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0"><Modal.Title className="fs-6 fw-bold text-dark">Encaisser Client</Modal.Title></Modal.Header>
        <Modal.Body className="pt-0 text-center"><Form.Control type="number" onChange={e => setPayment({...payment, amount: e.target.value})} className="fs-2 fw-bold text-center border-0 bg-light py-3 mb-3 text-dark" placeholder="0 DH"/><Button variant="primary" className="w-100 fw-bold shadow" onClick={handleAddAdvance}>VALIDER L'ENCAISSEMENT</Button></Modal.Body>
      </Modal>

      <Modal show={showExpenseModal} onHide={() => setShowExpenseModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0"><Modal.Title className="fs-6 fw-bold text-dark">Nouvelle Dépense</Modal.Title></Modal.Header>
        <Form onSubmit={handleLogExpense}><Modal.Body className="pt-0 text-dark">
            <Form.Select className="mb-2 fw-bold" required onChange={e => setNewExpense({...newExpense, category: e.target.value})}><option value="Matériaux">Matériaux</option>{categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}<option value="Transport">Transport</option></Form.Select>
            <Form.Control type="number" required onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="mb-2 fs-4 fw-bold text-center text-dark" placeholder="0 DH" />
            <Form.Control required onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="Détail..." /></Modal.Body>
            <Modal.Footer className="border-0"><Button variant="primary" type="submit" className="w-100 fw-bold shadow">ENREGISTRER</Button></Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showEditProjectModal} onHide={() => setShowEditProjectModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0"><Modal.Title className="fs-6 fw-bold text-dark">Infos Projet</Modal.Title></Modal.Header>
        <Form onSubmit={handleUpdateProject}>
            <Modal.Body className="pt-0 text-dark">
                <Form.Label className="x-small fw-bold">NOM DU PROJET</Form.Label><Form.Control value={editProjectData.projectName} onChange={e => setEditProjectData({...editProjectData, projectName: e.target.value})} className="mb-3"/>
                <Form.Label className="x-small fw-bold">BUDGET TOTAL (DH)</Form.Label><Form.Control type="number" value={editProjectData.totalPrice} onChange={e => setEditProjectData({...editProjectData, totalPrice: e.target.value})} className="mb-3" />
                <Form.Label className="x-small fw-bold">DEADLINE</Form.Label><Form.Control type="date" value={editProjectData.deadline} onChange={e => setEditProjectData({...editProjectData, deadline: e.target.value})} />
            </Modal.Body>
            <Modal.Footer className="border-0"><Button variant="primary" type="submit" className="w-100 fw-bold shadow">SAUVEGARDER</Button></Modal.Footer>
        </Form>
      </Modal>

      <ToastContainer position="top-end" className="p-3"><Toast show={toast.show} autohide delay={3000} onClose={() => setToast({...toast, show:false})} bg={toast.variant} className="text-white border-0 shadow"><Toast.Body className="fw-bold d-flex align-items-center gap-2">{toast.variant === 'success' ? <CheckCircle size={18}/> : <XCircle size={18}/>} {toast.message}</Toast.Body></Toast></ToastContainer>
    </Container>
  );
};

export default ProjectDetails;