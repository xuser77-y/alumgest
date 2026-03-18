import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Card } from 'react-bootstrap';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const Catalog = () => {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', basePrice: '' });

  const fetchCatalog = async () => {
    const res = await api.get('/catalog');
    setItems(res.data);
  };

  useEffect(() => { fetchCatalog(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/catalog', newProduct);
    setShowModal(false);
    fetchCatalog();
  };

  const confirmDelete = async () => {
    await api.delete(`/catalog/${targetId}`);
    setShowDeleteModal(false);
    fetchCatalog();
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="jakan-title m-0">CATALOGUE <span className="text-jakan">ARTICLES</span></h2>
        <Button variant="primary" onClick={() => setShowModal(true)} className="fw-bold shadow">+ AJOUTER</Button>
      </div>

      <Card className="jakan-card border-0 shadow-sm">
        <Table hover responsive className="m-0">
          <thead className="bg-light">
            <tr><th className="ps-4">DÉSIGNATION</th><th>PRIX UNITAIRE</th><th className="text-end pe-4">ACTIONS</th></tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item._id}>
                <td className="ps-4 fw-bold">{item.name}</td>
                <td className="text-jakan fw-bold">{item.basePrice} DH</td>
                <td className="text-end pe-4">
                  <Button variant="outline-danger" size="sm" onClick={() => { setTargetId(item._id); setShowDeleteModal(true); }}>
                    <Trash2 size={16}/>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Delete Confirmation */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
        <Modal.Body className="text-center p-4">
            <AlertTriangle size={48} className="text-danger mb-3" />
            <h5 className="fw-bold text-dark">Supprimer l'article ?</h5>
            <div className="d-grid gap-2 mt-4">
                <Button variant="danger" onClick={confirmDelete}>OUI, SUPPRIMER</Button>
                <Button variant="light" onClick={() => setShowDeleteModal(false)}>ANNULER</Button>
            </div>
        </Modal.Body>
      </Modal>

      {/* Add Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold">Nouvel Article</Modal.Title></Modal.Header>
        <Form onSubmit={handleAdd}>
          <Modal.Body className="pt-0">
            <Form.Label className="small fw-bold text-muted">DÉSIGNATION</Form.Label>
            <Form.Control required onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="mb-3 text-dark" />
            <Form.Label className="small fw-bold text-muted">PRIX DE BASE</Form.Label>
            <Form.Control type="number" required onChange={e => setNewProduct({...newProduct, basePrice: e.target.value})} className="text-dark" />
          </Modal.Body>
          <Modal.Footer className="border-0"><Button variant="primary" type="submit" className="w-100">ENREGISTRER</Button></Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};
export default Catalog;