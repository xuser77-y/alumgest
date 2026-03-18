import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Modal, Form, Badge } from 'react-bootstrap';
import { UserPlus, Trash2, Phone, DollarSign, Users, Activity, Edit3, AlertTriangle, X } from 'lucide-react';
import api from '../../services/api';
import './Workers.css';
import { useNavigate } from 'react-router-dom';

const AllWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const navigate = useNavigate();
  const [newWorker, setNewWorker] = useState({
    name: '', username: '', password: '', dailySalary: '', phone: '', poste: 'Fabrication'
  });

  const fetchWorkers = async () => {
    const res = await api.get('/workers');
    setWorkers(res.data);
  };

  useEffect(() => { fetchWorkers(); }, []);

  // Open Modal for Create
  const handleAddClick = () => {
    setIsEdit(false);
    setNewWorker({ name: '', username: '', password: '', dailySalary: '', phone: '', poste: 'Fabrication' });
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleEditClick = (worker) => {
    setIsEdit(true);
    setCurrentId(worker._id);
    setNewWorker({
      name: worker.name, username: worker.username, dailySalary: worker.dailySalary, phone: worker.phone, poste: worker.poste
    });
    setShowModal(true);
  };

  // Submit Handler (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.put(`/workers/${currentId}`, newWorker);
      } else {
        await api.post('/workers', newWorker);
      }
      setShowModal(false);
      fetchWorkers();
    } catch (err) { alert(err.response?.data?.message || "Erreur"); }
  };

  // Delete Handler
  const confirmDelete = async () => {
    try {
      await api.delete(`/workers/${workerToDelete._id}`);
      setShowDeleteModal(false);
      fetchWorkers();
    } catch (err) { console.error(err); }
  };

  return (
    <Container fluid className="py-4">
      {/* ── HEADER ── */}
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold m-0 jakan-title">GESTION DES <span className="text-jakan">OUVRIERS</span></h2>
          <p className="text-muted">Équipe de production Gil Jakan Aluminium.</p>
        </div>
        <Button variant="primary" onClick={handleAddClick} className="jakan-btn-lg">
          <UserPlus size={20} /> AJOUTER OUVRIER
        </Button>
      </div>

            {/* ── STATS ROW ── */}
      <Row className="mb-5 g-4">
        <Col md={4}>
          <div className="stats-card-jakan">
            <div className="d-flex align-items-center gap-3">
               <div className="p-3 bg-primary bg-opacity-10 rounded-3 text-primary"><Users /></div>
               <div>
                  <div className="text-muted small fw-bold uppercase">Total Équipe</div>
                  <h2 className="fw-bold m-0">{workers.length} Ouvriers</h2>
               </div>
            </div>
          </div>
        </Col>
        <Col md={4}>
          <div className="stats-card-jakan">
            <div className="d-flex align-items-center gap-3">
               <div className="p-3 bg-success bg-opacity-10 rounded-3 text-success"><DollarSign /></div>
               <div>
                  <div className="text-muted small fw-bold uppercase">Masse Salariale / Jour</div>
                  <h2 className="fw-bold m-0">{workers.reduce((acc, curr) => acc + (Number(curr.dailySalary) || 0), 0)} DH</h2>
               </div>
            </div>
          </div>
        </Col>
        <Col md={4}>
          <div className="stats-card-jakan">
            <div className="d-flex align-items-center gap-3">
               <div className="p-3 bg-info bg-opacity-10 rounded-3 text-info"><Activity /></div>
               <div>
                  <div className="text-muted small fw-bold uppercase">Capacité Atelier</div>
                  <h2 className="fw-bold m-0">100%</h2>
               </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── TABLE ── */}
      <div className="jakan-table shadow-sm bg-body">
        <Table hover responsive className="m-0 align-middle">
          <thead>
            <tr>
              <th className="ps-4">Identité</th>
              <th>Spécialité</th>
              <th>Date d'Embauche</th>
              <th>Salaire / J</th>
              <th>Contact</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workers.map(worker => (
              <tr key={worker._id}>
                <td className="ps-4 py-3">
                  <div 
                    className="d-flex align-items-center gap-3" 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => navigate(`/workers/profile/${worker._id}`)}
                  >
                    {/* The Avatar Letter */}
                    <div className="worker-avatar-circle shadow-sm">
                      {worker.name[0]}
                    </div>
                    
                    {/* The Name Info */}
                    <div>
                      <div className="fw-bold fs-6 text-jakan-hover">{worker.name}</div>
                      <small className="text-muted">@{worker.username}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge bg="primary bg-opacity-10" className="text-primary px-3 py-2" style={{ borderRadius: '8px' }}>
                    {worker.poste || 'Fabrication'}
                  </Badge>
                </td>
                <td className="text-muted small">
                  {new Date(worker.dateEmbauche).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </td>
                <td><span className="fw-bold">{worker.dailySalary} DH</span></td>
                <td><div className="small text-muted"><Phone size={14} className="me-1"/> {worker.phone}</div></td>
                <td className="text-end pe-4">
                  <div className="d-flex gap-2 justify-content-end">
                    <button className="btn-action-jakan" onClick={() => handleEditClick(worker)}><Edit3 size={18} /></button>
                    <button className="btn-action-jakan text-danger" onClick={() => { setWorkerToDelete(worker); setShowDeleteModal(true); }}><Trash2 size={18} /></button>
                    
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* ── ADD/EDIT MODAL ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold">{isEdit ? 'Modifier Profil' : 'Nouvel Ouvrier'}</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4 pt-0">
            <Row className="g-3">
              <Col md={12}><Form.Label className="jakan-label">Nom Complet</Form.Label><Form.Control value={newWorker.name} required onChange={e => setNewWorker({...newWorker, name: e.target.value})} /></Col>
              {!isEdit && (
                <>
                  <Col md={6}><Form.Label className="jakan-label">Username</Form.Label><Form.Control required onChange={e => setNewWorker({...newWorker, username: e.target.value})} /></Col>
                  <Col md={6}><Form.Label className="jakan-label">Password</Form.Label><Form.Control type="password" required onChange={e => setNewWorker({...newWorker, password: e.target.value})} /></Col>
                </>
              )}
              <Col md={6}><Form.Label className="jakan-label">Salaire / Jour</Form.Label><Form.Control type="number" value={newWorker.dailySalary} required onChange={e => setNewWorker({...newWorker, dailySalary: e.target.value})} /></Col>
              <Col md={6}><Form.Label className="jakan-label">Téléphone</Form.Label><Form.Control value={newWorker.phone} onChange={e => setNewWorker({...newWorker, phone: e.target.value})} /></Col>
              <Col md={12}><Form.Label className="jakan-label">Poste</Form.Label><Form.Select value={newWorker.poste} onChange={e => setNewWorker({...newWorker, poste: e.target.value})}>
                  <option value="Fabrication">Fabrication</option><option value="Coupe">Coupe</option><option value="Montage">Montage</option><option value="Installation">Installation (Site)</option>
              </Form.Select></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit">{isEdit ? 'Mettre à jour' : 'Créer Compte'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
        <Modal.Body className="text-center p-4">
          <div className="text-danger mb-3"><AlertTriangle size={50} /></div>
          <h5 className="fw-bold">Supprimer {workerToDelete?.name} ?</h5>
          <p className="text-muted small">Cette action est irréversible et supprimera tout l'historique associé.</p>
          <div className="d-flex gap-2 mt-4">
            <Button variant="light" className="w-100" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
            <Button variant="danger" className="w-100" onClick={confirmDelete}>Supprimer</Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AllWorkers;