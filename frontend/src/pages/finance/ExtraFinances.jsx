import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Badge, Toast, ToastContainer } from 'react-bootstrap';
import { PlusCircle, MinusCircle, Trash2, Settings, Tag, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const ExtraFinances = () => {
  const [categories, setCategories] = useState([]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showTransModal, setShowTransModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);   // from file 4
  const [catToDelete, setCatToDelete] = useState(null);            // from file 4
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' }); // from file 4

  const [newCat, setNewCat] = useState({ name: '', type: 'minus' });
  const [newTrans, setNewTrans] = useState({ type: 'minus', category: '', amount: '', description: '' });

  const fetchData = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  // from file 4: fallback + toast instead of alert
  const handleAddTrans = async (e) => {
    e.preventDefault();
    const finalData = {
      ...newTrans,
      category: newTrans.category || "Autre", // <── FALLBACK
      isSettled: true
    };
    try {
      await api.post('/transactions', finalData);
      setShowTransModal(false);
      setNewTrans({ type: 'minus', category: '', amount: '', description: '' });
      setToast({ show: true, message: 'Mouvement enregistré !', variant: 'success' });
    } catch (err) { setToast({ show: true, message: 'Erreur', variant: 'danger' }); }
  };

  // from file 3: unchanged
  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', newCat);
      setNewCat({ name: '', type: 'minus' });
      fetchData();
    } catch (err) { alert("Erreur: Catégorie déjà existante"); }
  };

  // from file 4: replaces window.confirm in file 3
  const confirmDeleteCategory = async () => {
    try {
      await api.delete(`/categories/${catToDelete}`);
      setShowDeleteModal(false);
      fetchData();
      setToast({ show: true, message: 'Catégorie supprimée', variant: 'danger' });
    } catch (err) { alert("Erreur"); }
  };

  return (
    <Container fluid className="py-4">

      {/* ── HEADER — from file 3 ── */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2 className="jakan-title m-0">GESTION <span className="text-jakan">HORS CHANTIER</span></h2>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => setShowCatModal(true)} className="fw-bold px-3 shadow-sm rounded-3">
            <Settings size={18} className="me-2"/> PARAMÈTRES CATÉGORIES
          </Button>
          <Button variant="success" onClick={() => { setNewTrans({...newTrans, type: 'plus'}); setShowTransModal(true); }} className="fw-bold px-4 shadow-sm rounded-3">
            + ENTRÉE (REVENU)
          </Button>
          <Button variant="danger" onClick={() => { setNewTrans({...newTrans, type: 'minus'}); setShowTransModal(true); }} className="fw-bold px-4 shadow-sm rounded-3">
            - SORTIE (DÉPENSE)
          </Button>
        </div>
      </div>

      {/* ── BODY — from file 3 ── */}
      <Row className="g-4">
        <Col md={4}>
          <Card className="jakan-card border-0 shadow-sm p-4">
            <h5 className="fw-bold jakan-title mb-4 fs-6">VOS CATÉGORIES ACTIVES</h5>
            <div className="d-flex flex-wrap gap-2">
              {categories.map(c => (
                <Badge key={c._id} bg={c.type === 'plus' ? 'success' : 'danger'} className="bg-opacity-10 text-dark p-2 border border-secondary border-opacity-10">
                  <Tag size={12} className="me-1"/> {c.name}
                </Badge>
              ))}
            </div>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="jakan-card border-0 shadow-sm p-4 bg-primary bg-opacity-10 border-primary border-opacity-25">
            <h5 className="fw-bold text-primary"><CheckCircle size={20} className="me-2"/> Centre d'aide</h5>
            <p className="text-muted small m-0 mt-2">
              Utilisez cette section pour enregistrer les frais fixes (Loyer, Electricité, Réparations)
              ou les revenus divers (Vente de chutes d'alu, recyclage). Les dépenses liées à un chantier
              spécifique doivent être enregistrées directement dans le dossier du projet pour un calcul de profit exact.
            </p>
          </Card>
        </Col>
      </Row>

      {/* ── MODAL: DELETE CONFIRMATION — from file 4 ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
        <Modal.Body className="text-center p-4">
          <AlertTriangle size={48} className="text-danger mb-3"/>
          <h5 className="fw-bold">Supprimer ?</h5>
          <p className="small text-muted">Cette catégorie sera retirée de la liste.</p>
          <div className="d-grid gap-2 mt-4">
            <Button variant="danger" onClick={confirmDeleteCategory}>OUI, SUPPRIMER</Button>
            <Button variant="light" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* ── MODAL: NOUVELLE TRANSACTION — from file 3 ── */}
      <Modal show={showTransModal} onHide={() => setShowTransModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold jakan-title">Mouvement de Caisse</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddTrans}>
          <Modal.Body className="pt-0">
            <Form.Label className="small fw-bold text-muted">CATÉGORIE</Form.Label>
            <Form.Select required onChange={e => setNewTrans({...newTrans, category: e.target.value})} className="mb-3 border-2 border-primary">
              <option value="">-- Sélectionner --</option>
              {categories.filter(c => c.type === newTrans.type).map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              <option value="Autre">-- Autre --</option>
            </Form.Select>
            <Form.Label className="small fw-bold text-muted">MONTANT (DH)</Form.Label>
            <Form.Control type="number" required onChange={e => setNewTrans({...newTrans, amount: e.target.value})} className="fs-3 fw-bold text-center mb-3 bg-light py-2" placeholder="0"/>
            <Form.Label className="small fw-bold text-muted">DESCRIPTION / JUSTIFICATION</Form.Label>
            <Form.Control required onChange={e => setNewTrans({...newTrans, description: e.target.value})} placeholder="Détail..." className="border-0 bg-light"/>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="primary" type="submit" className="w-100 fw-bold py-2 shadow-sm">ENREGISTRER MAINTENANT</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── MODAL: MANAGER CATÉGORIES — from file 3, delete now uses modal from file 4 ── */}
      <Modal show={showCatModal} onHide={() => setShowCatModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold jakan-title">Paramètres des Flux</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <Form onSubmit={handleAddCategory} className="mb-3">
            <div className="d-flex gap-1">
              <Form.Control placeholder="Nom" required value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} className="bg-light border-0"/>
              <Form.Select style={{width:'90px'}} onChange={e => setNewCat({...newCat, type: e.target.value})} className="bg-light border-0">
                <option value="minus">(-)</option>
                <option value="plus">(+)</option>
              </Form.Select>
              <Button variant="primary" type="submit"><Plus size={18}/></Button>
            </div>
          </Form>
          <div className="category-list-scrollable border rounded-3 p-1" style={{maxHeight:'250px', overflowY:'auto'}}>
            {categories.map(c => (
              <div key={c._id} className="d-flex justify-content-between p-2 border-bottom align-items-center">
                <span className="fw-bold small">{c.name} <small className="text-muted">({c.type})</small></span>
                <Trash2
                  size={16}
                  className="text-danger cursor-pointer"
                  onClick={() => { setCatToDelete(c._id); setShowCatModal(false); setShowDeleteModal(true); }}
                />
              </div>
            ))}
          </div>
        </Modal.Body>
      </Modal>

      {/* ── NOTIFICATIONS — from file 4 ── */}
      <ToastContainer position="top-end" className="p-3">
        <Toast show={toast.show} autohide delay={3000} onClose={() => setToast({...toast, show: false})} bg={toast.variant} className="text-white border-0 shadow">
          <Toast.Body className="fw-bold"><CheckCircle size={18}/> {toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>

    </Container>
  );
};

export default ExtraFinances;