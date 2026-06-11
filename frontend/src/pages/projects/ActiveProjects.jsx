import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, ProgressBar, Modal, Toast, ToastContainer } from 'react-bootstrap';
import { Plus, Search, User, DollarSign, ArrowRight, Wallet, CheckCircle, Clock, Filter } from 'lucide-react';
import api from '../../services/api';
import './Projects.css';
import { useNavigate } from 'react-router-dom';

const ActiveProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [clientMode, setClientMode] = useState('existing'); // 'existing' or 'new'
  const [newClient, setNewClient] = useState({ name: '', phone: '', address: '' });
  const [modalError, setModalError] = useState(''); // For showing error inside modal
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientName, setSelectedClientName] = useState('');
  const [newProject, setNewProject] = useState({
    projectName: '', client: '', totalPrice: '', advancePayment: '', deadline: ''
  });

  const fetchData = async () => {
    try {
      const [resProjects, resClients] = await Promise.all([
        api.get('/projects?status=active'),
        api.get('/clients') // We will build client CRUD later, for now just fetch
      ]);
      setProjects(resProjects.data);
      setClients(resClients.data);
      setLoading(false);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);
  const filteredClients = clients.filter(c => 
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
      c.phone.includes(clientSearch)
  );
    const handleCreate = async (e) => {
    e.preventDefault();
    setModalError(''); // Reset error
    
    try {
        let clientId = newProject.client;

        // 1. If NEW CLIENT mode, handle client creation first
        if (clientMode === 'new') {
        const clientRes = await api.post('/clients/check', newClient);
        clientId = clientRes.data.client._id;
        }

        // 2. Create the project using the clientId
        await api.post('/projects', { ...newProject, client: clientId });
        
        setShowAddModal(false);
        fetchData();
        setToast({ show: true, message: 'Projet et Client créés avec succès !', variant: 'success' });
    } catch (err) {
        setModalError("Erreur lors de la création. Vérifiez les champs.");
    }
    };

  // ── LOGIC FOR SUMMARY STRIP ──
  const totalValue = projects.reduce((acc, p) => acc + p.totalPrice, 0);
  const totalCollected = projects.reduce((acc, p) => acc + p.advancePayment, 0);

  const filteredProjects = projects.filter(p => 
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container fluid className="py-4">
      {/* ── HEADER & SEARCH ── */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="jakan-title m-0">CHANTIERS <span className="text-jakan">ACTIFS</span></h2>
          <p className="text-muted small">Gestion des villas et projets en cours de production.</p>
        </div>
        <div className="d-flex gap-2">
            <div className="search-wrapper shadow-sm">
                <Search size={18} className="ms-3 text-muted" />
                <Form.Control 
                    placeholder="Rechercher villa ou client..." 
                    className="border-0 bg-transparent py-2"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)} className="fw-bold px-4 shadow">
                <Plus size={20} className="me-1" /> NOUVEAU PROJET
            </Button>
        </div>
      </div>

      {/* ── SUMMARY STRIP ── */}
      <Row className="mb-4 g-3">
        <Col md={3}>
           <div className="summary-box-jakan blue">
              <div className="label">VALEUR TOTALE</div>
              <div className="value">{totalValue.toLocaleString()} DH</div>
              <div className="sub">{projects.length} Chantiers</div>
           </div>
        </Col>
        <Col md={3}>
           <div className="summary-box-jakan green">
              <div className="label">DÉJÀ ENCAISSÉ</div>
              <div className="value">{totalCollected.toLocaleString()} DH</div>
              <div className="sub text-success">{Math.round((totalCollected/totalValue)*100 || 0)}% du total</div>
           </div>
        </Col>
        <Col md={3}>
           <div className="summary-box-jakan red">
              <div className="label">RESTE À PERCEVOIR</div>
              <div className="value">{(totalValue - totalCollected).toLocaleString()} DH</div>
              <div className="sub text-danger">Dette clients</div>
           </div>
        </Col>
        <Col md={3}>
           <div className="summary-box-jakan amber">
              <div className="label">LIVRAISONS PRÉVUES</div>
              <div className="value">{projects.length}</div>
              <div className="sub">Ce mois-ci</div>
           </div>
        </Col>
      </Row>

      {/* ── PROJECTS GRID ── */}
      <Row className="g-4">
        {filteredProjects.map(project => {
          const totalTasks = project.items.length;
          const doneTasks = project.items.filter(i => i.status === 'finished').length;
          const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
          const advancePct = (project.advancePayment / project.totalPrice) * 100;

          return (
            <Col md={6} lg={4} key={project._id}>
              <Card className="project-card-jakan shadow-sm h-100 bg-body">
                <div className="project-accent-bar" />
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between mb-3">
                    <Badge bg="primary bg-opacity-10" className="text-primary px-3 py-2 border border-primary border-opacity-25">
                       {totalTasks} ÉLÉMENTS
                    </Badge>
                    <div className="text-muted small fw-bold">
                        <Clock size={14} className="me-1 text-warning"/> {project.deadline || '—'}
                    </div>
                  </div>

                  <h4 className="jakan-title mb-1 text-truncate">{project.client?.name || 'Client Inconnu'}</h4>
                  <div className="text-muted small d-flex align-items-center mb-4">
                    <span className="me-2 fw-bold">Chantier:</span> {project.projectName}
                  </div>

                  {/* Financial Mini Bar */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between x-small fw-bold mb-1">
                        <span className="text-muted">PAIEMENT</span>
                        <span className="text-jakan">{Math.round(advancePct)}%</span>
                    </div>
                    <div className="tri-finance-bar">
                        <div className="tri-segment-advance" style={{ width: `${advancePct}%` }} />
                    </div>
                  </div>

                  {/* Production Progress */}
                  <div className="p-3 bg-light bg-opacity-10 rounded-4 mb-4 border border-secondary border-opacity-10">
                    <div className="d-flex justify-content-between mb-2">
                        <span className="small fw-bold opacity-75">Production</span>
                        <span className="small fw-bold text-jakan">{progress}%</span>
                    </div>
                    <ProgressBar now={progress} style={{ height: '6px' }} className="shadow-inner"/>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="px-4 fw-bold rounded-3 shadow-sm"
                      onClick={() => navigate(`/projects/details/${project._id}`)}
                    >
                      OUVRIR <ArrowRight size={14} className="ms-1"/>
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )
        })}
      </Row>

      {/* ── ADD PROJECT MODAL ── */}
<Modal show={showAddModal} onHide={() => { setShowAddModal(false); setClientSearch(''); setSelectedClientName(''); }} centered size="lg">
    <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold jakan-title">Nouveau Chantier</Modal.Title></Modal.Header>
    <Form onSubmit={handleCreate}>
        <Modal.Body className="p-4 pt-0">
        
            {/* ── CLIENT TYPE TOGGLE ── */}
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

            {modalError && <div className="alert alert-danger py-2 small fw-bold mb-3">{modalError}</div>}

            <Row className="g-3">
                {/* ── CLIENT SECTION ── */}
                <Col md={12}>
                    {clientMode === 'existing' ? (
                        <Form.Group className="position-relative">
                            <Form.Label className="small fw-bold text-muted">RECHERCHER PAR NOM OU TÉLÉPHONE</Form.Label>
                            <div className="input-group mb-2 shadow-sm border rounded-3">
                                <span className="input-group-text bg-white border-0"><Search size={16} color="black" /></span>
                                <Form.Control 
                                    placeholder="Commencez à taper..." 
                                    className="border-0"
                                    value={selectedClientName || clientSearch}
                                    onChange={(e) => {
                                        setClientSearch(e.target.value);
                                        setSelectedClientName(''); // Clear selection if user types
                                        setNewProject({...newProject, client: ''});
                                    }}
                                />
                            </div>
                            
                            {/* SEARCH RESULTS DROPDOWN */}
                            {clientSearch && !selectedClientName && (
                                <div className="position-absolute w-100 bg-body shadow-lg rounded-3 border mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                    {filteredClients.length > 0 ? filteredClients.map(c => (
                                        <div 
                                            key={c._id} 
                                            className="p-3 border-bottom result-item-jakan cursor-pointer"
                                            onClick={() => {
                                                setNewProject({...newProject, client: c._id});
                                                setSelectedClientName(`${c.name} (${c.phone})`);
                                                setClientSearch('');
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="fw-bold small">{c.name}</div>
                                            <div className="text-muted x-small">{c.phone}</div>
                                        </div>
                                    )) : <div className="p-3 text-muted small">Aucun client trouvé.</div>}
                                </div>
                            )}

                            {selectedClientName && (
                                <div className="mt-2"><Badge bg="success" className="px-3 py-2">Client sélectionné : {selectedClientName}</Badge></div>
                            )}
                        </Form.Group>
                    ) : (
                        <div className="p-3 border rounded-3 bg-light bg-opacity-10 shadow-sm">
                            <Row className="g-2">
                                <Col md={6}><Form.Label className="x-small fw-bold">NOM COMPLET</Form.Label>
                                <Form.Control required onChange={e => setNewClient({...newClient, name: e.target.value})} /></Col>
                                <Col md={6}><Form.Label className="x-small fw-bold">TÉLÉPHONE</Form.Label>
                                <Form.Control onChange={e => setNewClient({...newClient, phone: e.target.value})} /></Col>
                                <Col md={12}><Form.Label className="x-small fw-bold">ADRESSE</Form.Label>
                                <Form.Control onChange={e => setNewClient({...newClient, address: e.target.value})} /></Col>
                            </Row>
                        </div>
                    )}
                </Col>

                {/* ── PROJECT SECTION ── */}
                <Col md={12} className="mt-4"><div className="border-bottom pb-1 mb-2 x-small fw-bold text-jakan">DÉTAILS DU CHANTIER</div></Col>
                
                <Col md={12}>
                    <Form.Label className="small fw-bold text-muted">NOM DU PROJET (VILLA / LIEU)</Form.Label>
                    <Form.Control required onChange={e => setNewProject({...newProject, projectName: e.target.value})} placeholder="Ex: Villa Alami - Hay Riad" />
                </Col>
                <Col md={6}>
                    <Form.Label className="small fw-bold text-muted">BUDGET TOTAL (DH)</Form.Label>
                    <Form.Control type="number" required onChange={e => setNewProject({...newProject, totalPrice: e.target.value})} />
                </Col>
                <Col md={6}>
                    <Form.Label className="small fw-bold text-muted">AVANCE PERÇUE (DH)</Form.Label>
                    <Form.Control type="number" required onChange={e => setNewProject({...newProject, advancePayment: e.target.value})} />
                </Col>
                <Col md={12}>
                    <Form.Label className="small fw-bold text-muted">DATE DE LIVRAISON PRÉVUE (OPTIONNEL)</Form.Label>
                    {/* REMOVED REQUIRED ATTRIBUTE 👇 */}
                    <Form.Control type="date" onChange={e => setNewProject({...newProject, deadline: e.target.value})} />
                </Col>
            </Row>
        </Modal.Body>
        <Modal.Footer className="border-0">
            <Button variant="light" onClick={() => setShowAddModal(false)}>Annuler</Button>
            <Button 
                variant="primary" 
                type="submit" 
                className="px-5 fw-bold shadow"
                disabled={clientMode === 'existing' && !newProject.client}
            >
                ENREGISTRER TOUT
            </Button>
        </Modal.Footer>
    </Form>
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

export default ActiveProjects;