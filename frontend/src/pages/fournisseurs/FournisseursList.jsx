import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Toast, ToastContainer } from 'react-bootstrap';
import { Truck, Plus, Eye, Phone, MapPin, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const FournisseursList = () => {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', bg: 'success' });
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);

  const showToast = (message, bg = 'success') => setToast({ show: true, message, bg });

  const fetchFournisseurs = async () => {
    try {
      const res = await api.get('/fournisseurs');
      setFournisseurs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFournisseurs();
  }, []);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const executeAddFournisseur = async () => {
    try {
      await api.post('/fournisseurs', formData);
      setShowAddModal(false);
      setShowConfirmModal(false);
      setFormData({ name: '', phone: '', email: '', address: '' });
      fetchFournisseurs();
      showToast("Fournisseur ajouté avec succès.");
    } catch (err) {
      console.error(err);
      setShowConfirmModal(false);
      showToast("Erreur lors de l'ajout du fournisseur.", "danger");
    }
  };

  const handleEditClick = (fournisseur) => {
    setSelectedFournisseur(fournisseur);
    setFormData({ name: fournisseur.name, phone: fournisseur.phone || '', email: fournisseur.email || '', address: fournisseur.address || '' });
    setShowEditModal(true);
  };

  const executeEditFournisseur = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/fournisseurs/${selectedFournisseur._id}`, formData);
      setShowEditModal(false);
      setFormData({ name: '', phone: '', email: '', address: '' });
      fetchFournisseurs();
      showToast("Fournisseur mis à jour avec succès.");
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la mise à jour.", "danger");
    }
  };

  const handleDeleteClick = (fournisseur) => {
    setSelectedFournisseur(fournisseur);
    setShowDeleteModal(true);
  };

  const executeDeleteFournisseur = async () => {
    try {
      await api.delete(`/fournisseurs/${selectedFournisseur._id}`);
      setShowDeleteModal(false);
      fetchFournisseurs();
      showToast("Fournisseur supprimé avec succès.");
    } catch (err) {
      console.error(err);
      setShowDeleteModal(false);
      showToast("Erreur lors de la suppression.", "danger");
    }
  };

  // Calculate totals
  const totalDebt = fournisseurs.reduce((acc, f) => acc + (f.totalBought - f.totalPaid), 0);

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="jakan-title m-0">LISTE DES <span className="text-jakan">FOURNISSEURS</span></h2>
        <Button variant="primary" className="btn-jakan d-flex align-items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Nouveau Fournisseur
        </Button>
      </div>

      <Row className="mb-4">
        <Col md={4}>
          <div className="finance-stat-card expense p-4 shadow">
            <div className="small fw-bold opacity-75 text-white">RESTE À PAYER TOTAL</div>
            <h2 className="fw-bold m-0 fs-1 text-white">{totalDebt.toLocaleString()} DH</h2>
          </div>
        </Col>
      </Row>

      <div className="jakan-table shadow-sm bg-body border rounded-4 overflow-hidden">
        <Table hover responsive className="m-0 align-middle">
          <thead>
            <tr>
              <th className="ps-4">Fournisseur</th>
              <th>Contact</th>
              <th>Total Acheté</th>
              <th>Total Payé</th>
              <th>Reste à Payer</th>
              <th className="text-center pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fournisseurs.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-5 text-muted">Aucun fournisseur trouvé.</td>
              </tr>
            ) : (
              fournisseurs.map(f => {
                const restToPay = f.totalBought - f.totalPaid;
                return (
                  <tr key={f._id}>
                    <td className="ps-4 fw-bold">{f.name}</td>
                    <td>
                      <div className="small text-muted d-flex flex-column gap-1">
                        {f.phone && <span><Phone size={12} className="me-1"/>{f.phone}</span>}
                        {f.address && <span><MapPin size={12} className="me-1"/>{f.address}</span>}
                      </div>
                    </td>
                    <td className="fw-bold">{f.totalBought.toLocaleString()} DH</td>
                    <td className="fw-bold text-success">{f.totalPaid.toLocaleString()} DH</td>
                    <td>
                      <Badge bg={restToPay > 0 ? "danger" : "success"} className="px-3 py-2 fs-6">
                        {restToPay.toLocaleString()} DH
                      </Badge>
                    </td>
                    <td className="text-center pe-4">
                      <div className="d-flex justify-content-center gap-2">
                        <Button as={Link} to={`/fournisseurs/${f._id}`} variant="light" size="sm" className="btn-icon">
                          <Eye size={18} />
                        </Button>
                        <Button variant="light" size="sm" className="btn-icon text-primary" onClick={() => handleEditClick(f)}>
                          <Edit size={18} />
                        </Button>
                        <Button variant="light" size="sm" className="btn-icon text-danger" onClick={() => handleDeleteClick(f)}>
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </div>

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Ajouter Fournisseur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Nom du Fournisseur *</Form.Label>
              <Form.Control 
                type="text" 
                required 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Téléphone</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Email</Form.Label>
              <Form.Control 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">Adresse</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2} 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </Form.Group>
            <Button type="submit" variant="primary" className="w-100 btn-jakan py-2 fw-bold">
              Ajouter
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal Confirm */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Confirmer</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-muted">
          Êtes-vous sûr de vouloir ajouter ce fournisseur ?
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowConfirmModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={executeAddFournisseur}>Confirmer</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Modifier Fournisseur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={executeEditFournisseur}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Nom du Fournisseur *</Form.Label>
              <Form.Control type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Téléphone</Form.Label>
              <Form.Control type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Email</Form.Label>
              <Form.Control type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">Adresse</Form.Label>
              <Form.Control as="textarea" rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </Form.Group>
            <Button type="submit" variant="primary" className="w-100 btn-jakan py-2 fw-bold">Mettre à jour</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-danger">Supprimer</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-muted">
          Êtes-vous sûr de vouloir supprimer le fournisseur <strong>{selectedFournisseur?.name}</strong> ? Cette action est irréversible et supprimera également l'historique associé.
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={executeDeleteFournisseur}>Supprimer</Button>
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

export default FournisseursList;
