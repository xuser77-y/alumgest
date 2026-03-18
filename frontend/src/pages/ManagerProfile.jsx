import React, { useState, useContext, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Toast, ToastContainer, Modal } from 'react-bootstrap';
import { Settings, ShieldCheck, Moon, Sun, LogOut, Key, CheckCircle, XCircle, ShieldAlert, Database, Lock } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { UIContext } from '../context/UIContext';
import api from '../services/api';
import './ManagerProfile.css';

const ManagerProfile = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme, lang, changeLanguage } = useContext(UIContext);

  // Initialize with empty array to prevent .map() errors
  const [stats, setStats] = useState({ liquidCash: 0, workersCount: 0, workerList: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  
  // Own Password State
  const [passwordData, setPasswordData] = useState({ old: '', new: '', confirm: '' });

  // Worker Reset State
  const [workerReset, setWorkerReset] = useState({ id: '', pass: '' });

  // ── SECURE EXPORT STATES ──
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
        try {
            const res = await api.get('/manager/stats');
            // Ensure workerList exists in the response
            setStats({
                liquidCash: res.data.liquidCash || 0,
                workersCount: res.data.workersCount || 0,
                workerList: res.data.workerList || []
            });
            setLoading(false);
        } catch (err) {
            console.error("Load Stats Error:", err);
            setLoading(false);
        }
    };
    fetchStats();
  }, []);

  const handleOwnUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      setToast({ show: true, message: 'La confirmation ne correspond pas', variant: 'danger' });
      return;
    }
    try {
      await api.put('/manager/update-own-password', { 
        oldPassword: passwordData.old, 
        newPassword: passwordData.new 
      });
      setToast({ show: true, message: 'Votre mot de passe a été changé !', variant: 'success' });
      setPasswordData({ old: '', new: '', confirm: '' });
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.message || 'Erreur de sécurité', variant: 'danger' });
    }
  };

  const handleExportData = async () => {
    try {
        const response = await api.get('/manager/export-backup');
        
        // Create a Blob from the JSON data
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        
        // Name the file with today's date
        const date = new Date().toISOString().split('T')[0];
        const fileName = `AlumGest_Backup_${date}.json`;
        
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", fileName);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        setToast({ show: true, message: 'Sauvegarde téléchargée avec succès !', variant: 'success' });
    } catch (err) {
        setToast({ show: true, message: 'Erreur lors de l\'exportation', variant: 'danger' });
    }
  };

  // ── SECURE EXPORT FUNCTION ──
  const handleSecureExport = async (e) => {
    e.preventDefault();
    setIsExporting(true);
    try {
        const response = await api.post('/manager/export-secure', { password: exportPassword });
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `AlumGest_FULL_BACKUP_${date}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        setShowExportModal(false);
        setExportPassword('');
        setToast({ show: true, message: 'Base de données exportée avec succès !', variant: 'success' });
    } catch (err) {
        setToast({ show: true, message: err.response?.data?.message || 'Erreur de mot de passe', variant: 'danger' });
    } finally {
        setIsExporting(false);
    }
  };

  const handleWorkerReset = async (e) => {
    e.preventDefault();
    if (!workerReset.id || !workerReset.pass) return;
    try {
      await api.put('/manager/reset-worker-password', { 
        workerId: workerReset.id, 
        newPassword: workerReset.pass 
      });
      setToast({ show: true, message: 'Mot de passe ouvrier mis à jour !', variant: 'success' });
      setWorkerReset({ id: '', pass: '' });
    } catch (err) {
        setToast({ show: true, message: 'Erreur lors de la réinitialisation', variant: 'danger' });
    }
  };

  if (loading) return <div className="vh-100 d-flex align-items-center justify-content-center jakan-title">Accès au Poste de Commande...</div>;

  return (
    <Container fluid className="py-4">
      {/* ── HERO STATS ── */}
      <div className="profile-hero shadow-lg d-flex align-items-center flex-wrap gap-4">
        <div className="avatar-commander">{user?.name?.[0]}</div>
        <div className="flex-grow-1" style={{ zIndex: 1 }}>
          <Badge bg="white" className="text-primary mb-2 fw-bold px-3 py-2 rounded-pill shadow-sm">
            <span className="status-indicator"></span> SESSION GÉRANT ACTIVE
          </Badge>
          <h1 className="display-4 fw-bold jakan-title text-white m-0">{user?.name}</h1>
          <p className="opacity-75 fs-5 text-white">Gil Jakan Aluminium · Directeur Général</p>
        </div>
        <div className="d-flex gap-3" style={{ zIndex: 1 }}>
          <div className="text-center bg-white bg-opacity-10 p-3 rounded-4 border border-white border-opacity-20 min-w-[120px]">
            <div className="small opacity-75 fw-bold text-uppercase text-white text-center">Équipe</div>
            <h3 className="fw-bold m-0 text-white text-center">{stats.workersCount}</h3>
          </div>
          <div className="text-center bg-white bg-opacity-10 p-3 rounded-4 border border-white border-opacity-20 min-w-[150px]">
            <div className="small opacity-75 fw-bold text-uppercase text-white text-center">Caisse DH</div>
            <h3 className="fw-bold m-0 text-white text-center">{stats.liquidCash.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <Row className="g-4">
        {/* ── COLUMN 1: APP PREFERENCES ── */}
        <Col lg={4}>
          <div className="settings-card shadow-sm bg-body">
            <h4 className="jakan-title mb-4 d-flex align-items-center">
              <Settings className="me-2 text-jakan" /> CONFIGURATION
            </h4>
            <div className="d-flex justify-content-between align-items-center p-3 rounded-4 border mb-3">
              <div><div className="fw-bold">Thème Visuel</div><small className="text-muted">Passer en mode {theme === 'dark' ? 'Clair' : 'Sombre'}</small></div>
              <Button variant={theme === 'dark' ? 'primary' : 'warning'} onClick={toggleTheme} className="rounded-circle p-2 shadow-sm">
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              </Button>
            </div>
            <div className="d-flex justify-content-between align-items-center p-3 rounded-4 border mb-4">
              <div><div className="fw-bold">Langue Locale</div><small className="text-muted">Actuelle: {lang.toUpperCase()}</small></div>
              <Form.Select style={{ width: '100px' }} value={lang} onChange={(e) => changeLanguage(e.target.value)} className="fw-bold border-primary bg-body shadow-sm">
                <option value="fr">FR</option><option value="en">EN</option><option value="ar">AR</option>
              </Form.Select>
            </div>
            <Button variant="danger" onClick={logout} className="w-100 py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
                <LogOut size={18}/> DÉCONNEXION
            </Button>
          </div>
        </Col>

        {/* ── COLUMN 2: ADMIN SECURITY ── */}
        <Col lg={4}>
          <div className="settings-card shadow-sm bg-body">
            <h4 className="jakan-title mb-4 d-flex align-items-center">
              <ShieldCheck className="me-2 text-jakan" /> MA SÉCURITÉ
            </h4>
            <Form onSubmit={handleOwnUpdate}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted uppercase">Mot de passe actuel</Form.Label>
                <Form.Control type="password" required value={passwordData.old} onChange={e => setPasswordData({...passwordData, old: e.target.value})} className="bg-light border-0 py-2 text-dark" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted uppercase">Nouveau pass</Form.Label>
                <Form.Control type="password" required value={passwordData.new} onChange={e => setPasswordData({...passwordData, new: e.target.value})} className="bg-light border-0 py-2 text-dark" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted uppercase">Confirmation</Form.Label>
                <Form.Control type="password" required value={passwordData.confirm} onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} className="bg-light border-0 py-2 text-dark" />
              </Form.Group>
              <Button variant="primary" type="submit" className="w-100 py-2 fw-bold shadow mt-2">CHANGER MON PASS</Button>
            </Form>
          </div>
        </Col>

        {/* ── COLUMN 3: TEAM SECURITY ── */}
        <Col lg={4}>
          <div className="settings-card shadow-sm bg-body border-jakan">
            <h4 className="jakan-title mb-4 d-flex align-items-center text-primary">
              <ShieldAlert className="me-2" /> ACCÈS ÉQUIPE
            </h4>
            <p className="small text-muted mb-4">Réinitialiser l'accès d'un ouvrier s'il a oublié ses identifiants.</p>
            <Form onSubmit={handleWorkerReset}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted uppercase">Sélectionner ouvrier</Form.Label>
                <Form.Select required value={workerReset.id} onChange={e => setWorkerReset({...workerReset, id: e.target.value})} className="bg-light border-0 text-dark fw-bold">
                    <option value="">-- Choisir --</option>
                    {stats.workerList?.map(w => (
                        <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-muted uppercase">Nouveau mot de passe</Form.Label>
                <Form.Control type="text" required value={workerReset.pass} onChange={e => setWorkerReset({...workerReset, pass: e.target.value})} className="bg-light border-0 py-2 text-dark fw-bold" placeholder="Ex: GilJakan2025" />
              </Form.Group>
              <Button variant="outline-primary" type="submit" className="w-100 py-2 fw-bold border-2">CHANGER LE PASS OUVRIER</Button>
            </Form>
          </div>
        </Col>
      </Row>

      {/* ── BACKUP / MAINTENANCE ── */}
      <Row className="g-4 mt-1">
        <Col lg={4}>
          <div className="settings-card shadow-sm bg-body border-secondary">
            <h4 className="jakan-title mb-3 d-flex align-items-center text-secondary">
              <Database className="me-2" /> MAINTENANCE
            </h4>

            {/* SECURE EXPORT */}
            <Button 
              variant="outline-primary" 
              className="w-100 text-start d-flex align-items-center justify-content-between py-3 border-2 mb-2"
              onClick={() => setShowExportModal(true)}
            >
                <div className="d-flex align-items-center gap-2">
                    <Database size={20} />
                    <span className="fw-bold">Exporter la Base de Données (JSON)</span>
                </div>
                <Lock size={16} className="text-muted" />
            </Button>

            <small className="text-muted" style={{fontSize: '0.7rem'}}>
              * Ce fichier contient tous vos ouvriers, chantiers et historique financier. Gardez-le en sécurité.
            </small>
          </div>
        </Col>
      </Row>

      {/* ── SECURE EXPORT MODAL ── */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fs-6 fw-bold text-dark">Vérification de Sécurité</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSecureExport}>
          <Modal.Body className="text-center pt-0 text-dark">
              <ShieldAlert size={40} className="text-primary mb-3" />
              <p className="small text-muted">Veuillez entrer votre mot de passe administrateur pour autoriser l'exportation des données sensibles.</p>
              <Form.Control 
                  type="password" 
                  placeholder="Votre mot de passe"
                  required
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  className="bg-light border-0 text-center fw-bold py-2"
                  autoFocus
              />
              <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 mt-3 fw-bold py-2"
                  disabled={isExporting}
              >
                  {isExporting ? 'PRÉPARATION...' : 'TÉLÉCHARGER LE FICHIER'}
              </Button>
          </Modal.Body>
        </Form>
      </Modal>

      {/* ── NOTIFICATIONS ── */}
      <ToastContainer position="top-end" className="p-3">
        <Toast show={toast.show} autohide delay={3000} onClose={() => setToast({...toast, show: false})} bg={toast.variant} className="text-white border-0 shadow-lg">
          <Toast.Body className="fw-bold d-flex align-items-center gap-2">
            {toast.variant === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />} {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default ManagerProfile;