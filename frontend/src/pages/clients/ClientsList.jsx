import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Toast, ToastContainer } from 'react-bootstrap';
import { UserCircle, Plus, Eye, Phone, MapPin, Mail, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const ClientsList = () => {
  const [clients, setClients] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', bg: 'success' });
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [selectedClient, setSelectedClient] = useState(null);

  const showToast = (message, bg = 'success') => setToast({ show: true, message, bg });

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const executeAddClient = async () => {
    try {
      await api.post('/clients/check', formData);
      showToast("Client ajouté avec succès.");
      setShowAddModal(false);
      setShowConfirmModal(false);
      setFormData({ name: '', phone: '', email: '', address: '' });
      fetchClients();
    } catch (err) {
      console.error(err);
      setShowConfirmModal(false);
      showToast("Erreur lors de l'ajout du client.", "danger");
    }
  };

  const handleEditClick = (client) => {
    setSelectedClient(client);
    setFormData({ name: client.name, phone: client.phone || '', email: client.email || '', address: client.address || '' });
    setShowEditModal(true);
  };

  const executeEditClient = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/clients/${selectedClient._id}`, formData);
      setShowEditModal(false);
      setFormData({ name: '', phone: '', email: '', address: '' });
      fetchClients();
      showToast("Client mis à jour avec succès.");
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la mise à jour.", "danger");
    }
  };

  const handleDeleteClick = (client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const executeDeleteClient = async () => {
    try {
      await api.delete(`/clients/${selectedClient._id}`);
      setShowDeleteModal(false);
      fetchClients();
      showToast("Client supprimé avec succès.");
    } catch (err) {
      console.error(err);
      setShowDeleteModal(false);
      showToast("Erreur lors de la suppression.", "danger");
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="jakan-title m-0">LISTE DES <span className="text-jakan">CLIENTS</span></h2>
        <Button variant="primary" className="btn-jakan d-flex align-items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Nouveau Client
        </Button>
      </div>

      <div className="jakan-table shadow-sm bg-body border rounded-4 overflow-hidden">
        <Table hover responsive className="m-0 align-middle">
          <thead>
            <tr>
              <th className="ps-4">Nom du Client</th>
              <th>Contact Info</th>
              <th>Email</th>
              <th className="text-center pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center p-5 text-muted">Aucun client trouvé.</td>
              </tr>
            ) : (
              clients.map(c => (
                <tr key={c._id}>
                  <td className="ps-4 fw-bold">{c.name}</td>
                  <td>
                    <div className="small text-muted d-flex flex-column gap-1">
                      {c.phone && <span><Phone size={12} className="me-1"/>{c.phone}</span>}
                      {c.address && <span><MapPin size={12} className="me-1"/>{c.address}</span>}
                    </div>
                  </td>
                  <td>
                    {c.email ? <span className="small text-muted"><Mail size={12} className="me-1"/>{c.email}</span> : '-'}
                  </td>
                  <td className="text-center pe-4">
                    <div className="d-flex justify-content-center gap-2">
                      <Button as={Link} to={`/clients/${c._id}`} variant="light" size="sm" className="btn-icon">
                        <Eye size={18} />
                      </Button>
                      <Button variant="light" size="sm" className="btn-icon text-primary" onClick={() => handleEditClick(c)}>
                        <Edit size={18} />
                      </Button>
                      <Button variant="light" size="sm" className="btn-icon text-danger" onClick={() => handleDeleteClick(c)}>
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Ajouter Client</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Nom du Client *</Form.Label>
              <Form.Control type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Téléphone *</Form.Label>
              <Form.Control type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Email</Form.Label>
              <Form.Control type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">Adresse</Form.Label>
              <Form.Control as="textarea" rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </Form.Group>
            <Button type="submit" variant="primary" className="w-100 btn-jakan py-2 fw-bold">Ajouter</Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Confirmer</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-muted">Êtes-vous sûr de vouloir ajouter ce client ?</Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowConfirmModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={executeAddClient}>Confirmer</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Modifier Client</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={executeEditClient}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Nom du Client *</Form.Label>
              <Form.Control type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Téléphone *</Form.Label>
              <Form.Control type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
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
          Êtes-vous sûr de vouloir supprimer le client <strong>{selectedClient?.name}</strong> ? Cette action est irréversible.
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={executeDeleteClient}>Supprimer</Button>
        </Modal.Footer>
      </Modal>

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

export default ClientsList;
