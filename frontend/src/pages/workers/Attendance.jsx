import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal,Form, Badge , Toast, ToastContainer } from 'react-bootstrap';
import { Calendar, Save, Truck, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight ,Lock } from 'lucide-react';
import api from '../../services/api';
import './Workers.css';

const Attendance = () => {
  const [workers, setWorkers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({}); // { workerId: { status, displacement } }
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [isSaving, setIsSaving] = useState(false);
  const [lockedWorkers, setLockedWorkers] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const workersRes = await api.get('/workers');
      const attendanceRes = await api.get(`/attendance/${selectedDate}`);
      
      setWorkers(workersRes.data);
      setLockedWorkers(attendanceRes.data.lockedWorkerIds); // Store locked IDs

      const map = {};
      workersRes.data.forEach(w => map[w._id] = { status: 'absent', displacement: false });
      
      // Update map with records
      attendanceRes.data.records.forEach(rec => {
        map[rec.workerId] = { status: rec.status, displacement: rec.displacement };
      });
      
      setAttendanceData(map);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [selectedDate]);

    const handleStatusChange = (id, status) => {
    setAttendanceData(prev => ({
        ...prev,
        [id]: { 
        ...prev[id], 
        status,
        // If status is absent, force displacement to false
        displacement: status === 'absent' ? false : prev[id].displacement 
        }
    }));
    };

  const handleDisplacementChange = (id) => {
    setAttendanceData(prev => ({
      ...prev,
      [id]: { ...prev[id], displacement: !prev[id].displacement }
    }));
  };

  const handleSaveClick = () => {
    setShowConfirmModal(true);
  };


  const confirmSave = async () => {
    setIsSaving(true); // Start loading spinner
    
    // ── FIX: We must define 'records' here ──
    const records = Object.keys(attendanceData).map(workerId => ({
      workerId,
      ...attendanceData[workerId]
    }));

    try {
      await api.post('/attendance/bulk', { date: selectedDate, records });
      setShowConfirmModal(false);
      setToast({ show: true, message: 'Données enregistrées avec succès !', variant: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Erreur lors de l\'enregistrement', variant: 'danger' });
    } finally {
      setIsSaving(false); // Stop loading spinner
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 jakan-title">SUIVI DES <span className="text-jakan">PRÉSENCES</span></h2>
          <p className="text-muted">Pointage quotidien et bonus de déplacement.</p>
        </div>
        <div className="d-flex gap-3 align-items-center bg-body p-2 rounded-3 shadow-sm border">
          <Calendar size={20} className="text-jakan ms-2" />
          <Form.Control 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-0 bg-transparent fw-bold"
          />
        </div>
      </div>

      <Card className="jakan-table shadow-sm border-0">
        <Table responsive hover className="m-0 align-middle text-center">
          <thead className="bg-body-tertiary">
            <tr>
              <th className="text-start ps-4">Ouvrier</th>
              <th>Statut du Jour</th>
              <th>Déplacement Site (+0.5)</th>
              <th>Calcul Journalier</th>
            </tr>
          </thead>
          <tbody>
            {workers.map(worker => {
              const data = attendanceData[worker._id] || { status: 'absent', displacement: false };
              const isLocked = lockedWorkers.includes(worker._id); // <── CHECK LOCK
              // Pay Logic: Status multiplier + Displacement bonus
              let multiplier = data.status === 'full' ? 1 : data.status === 'half' ? 0.5 : 0;
              let bonus = data.displacement ? 0.5 : 0;
              let totalPay = (worker.dailySalary * multiplier) + (worker.dailySalary * bonus);

              return (
                <tr key={worker._id} className={isLocked ? 'opacity-75 bg-light bg-opacity-10' : ''}>
                  <td className="text-start ps-4">
                    <div className="fw-bold">{worker.name}</div>
                    {isLocked && <Badge bg="secondary" className="small"><Lock size={10}/> PÉRIODE VERROUILLÉE</Badge>}
                  </td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <Button 
                        disabled={isLocked} // <── DISABLE
                        className={data.status === 'full' ? 'btn-status shadow-sm' : 'btn-status btn-status-outline'}
                        variant={data.status === 'full' ? 'success' : ''} 
                        onClick={() => handleStatusChange(worker._id, 'full')}
                      >Plein</Button>
                      
                      <Button 
                        disabled={isLocked} // <── DISABLE
                        className={data.status === 'half' ? 'btn-status shadow-sm' : 'btn-status btn-status-outline'}
                        variant={data.status === 'half' ? 'warning' : ''} 
                        onClick={() => handleStatusChange(worker._id, 'half')}
                      >Demi</Button>
                      
                      <Button 
                        disabled={isLocked} // <── DISABLE
                        className={data.status === 'absent' ? 'btn-status shadow-sm' : 'btn-status btn-status-outline'}
                        variant={data.status === 'absent' ? 'danger' : ''} 
                        onClick={() => handleStatusChange(worker._id, 'absent')}
                      >Absent</Button>
                    </div>
                  </td>
                  <td>
                    <Form.Check 
                      type="switch"
                      disabled={isLocked || data.status === 'absent'} // <── DISABLE
                      checked={data.displacement}
                      onChange={() => handleDisplacementChange(worker._id)}
                        className="jakan-switch"
                    />
                </td>
                  <td>
                    <div className="fw-bold text-jakan fs-5">{totalPay} DH</div>
                    <small className="text-muted">{worker.dailySalary} DH base</small>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        <div className="p-4 bg-body border-top d-flex justify-content-end">
            <Button 
              variant="primary" 
              className="fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2" 
              onClick={handleSaveClick} // ✅ This opens the modal first!
              disabled={isSaving}
            >
              <Save size={20} className="me-2" /> ENREGISTRER LA JOURNÉE
            </Button>
        </div>
      </Card>
      {/* ── SAFETY CONFIRMATION MODAL ── */}
      <Modal 
        show={showConfirmModal} 
        onHide={() => setShowConfirmModal(false)} 
        centered 
        size="sm"
        className="jakan-modal"
      >
        <Modal.Body className="text-center p-4">
          <div className="text-primary mb-3 mt-2">
            <CheckCircle size={54} strokeWidth={1.5} />
          </div>
          
          <h4 className="jakan-title mb-2">Confirmer le Pointage</h4>
          <p className="text-muted small px-3">
            Voulez-vous enregistrer les présences pour la date du <br />
            <strong className="text-jakan">{new Date(selectedDate).toLocaleDateString('fr-FR')}</strong> ?
          </p>

          <div className="d-grid gap-2 mt-4">
            <Button 
              variant="primary" 
              className="fw-bold py-2 shadow-sm" 
              onClick={confirmSave}
            >
              OUI, ENREGISTRER
            </Button>
            <Button 
              variant="link" 
              className="text-muted text-decoration-none small" 
              onClick={() => setShowConfirmModal(false)}
            >
              Annuler
            </Button>
          </div>
        </Modal.Body>
      </Modal>
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast 
          onClose={() => setToast({ ...toast, show: false })} 
          show={toast.show} 
          delay={3000} 
          autohide 
          bg={toast.variant}
          className="border-0 shadow-lg text-white"
        >
          <Toast.Body className="d-flex align-items-center gap-2">
            <CheckCircle size={18} /> {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
    
  );
};

export default Attendance;