import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Modal, Form, Button, Toast, ToastContainer } from 'react-bootstrap';
import { Wallet, ArrowUpRight, ArrowDownLeft, Filter, ChevronLeft, ChevronRight, FileText, Search, Edit3, Trash2, CheckCircle, XCircle, Lock, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { amiriFont } from '../../utils/amiriFont';
import './Finance.css';

const History = () => {
  const [transactions, setTransactions] = useState([]);
  const [uniqueCats, setUniqueCats] = useState([]); // Real categories from DB
  const [years, setYears] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filters, setFilters] = useState({ type: '', category: '', year: 'all', month: 'all' , search: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [editForm, setEditForm] = useState({ date: '', category: '', description: '', amount: '' });
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const loadData = async () => {
    try {
      const queryString = `type=${filters.type}&category=${encodeURIComponent(filters.category)}&year=${filters.year}&month=${filters.month}&search=${filters.search}`;
      const [resTrans, resCats, resYears] = await Promise.all([
        api.get(`/transactions?${queryString}`),
        api.get('/transactions/categories/unique'),
        api.get('/transactions/years')
      ]);
      setTransactions(resTrans.data);
      setUniqueCats(resCats.data);
      setYears(resYears.data);
      setCurrentPage(1); 
    } catch (err) { console.error(err); }
  };

  const handleEditClick = (t) => {
    setSelectedTransaction(t);
    setEditForm({
      date: new Date(t.date).toISOString().split('T')[0],
      category: t.category,
      description: t.description,
      amount: t.amount
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/transactions/${selectedTransaction._id}`, editForm);
      setShowEditModal(false);
      loadData();
      setToast({ show: true, message: 'Transaction mise à jour !', variant: 'success' });
    } catch (err) {
      setToast({ show: true, message: 'Erreur lors de la mise à jour', variant: 'danger' });
    }
  };

  const handleDeleteClick = (t) => {
    setSelectedTransaction(t);
    setDeletePassword('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const confirmDelete = async (e) => {
    if (e) e.preventDefault();
    setDeleteError('');
    try {
      await api.delete(`/transactions/${selectedTransaction._id}`, {
        data: { password: deletePassword }
      });
      setShowDeleteModal(false);
      loadData();
      setToast({ show: true, message: 'Transaction supprimée !', variant: 'success' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la suppression';
      setDeleteError(msg);
      setToast({ show: true, message: msg, variant: 'danger' });
    }
  };

  useEffect(() => { loadData(); }, [filters]);

  // ── PAGINATION LOGIC ──
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const currentItems = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ── TOTALS ──
  const totalIn = transactions.filter(t => t.type === 'plus').reduce((acc, t) => acc + t.amount, 0);
  const totalOut = transactions.filter(t => t.type === 'minus').reduce((acc, t) => acc + t.amount, 0);

  // ── PDF GENERATOR ──
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.addFileToVFS('amiri.ttf', amiriFont);
    doc.addFont('amiri.ttf', 'amiri', 'normal');
    const logoUrl = "/logo.jpg";

    /* ───── HEADER ───── */

    try {
      doc.addImage(logoUrl, "JPG", 14, 10, 25, 25);
    } catch (e) {}

    doc.setFont("amiri", "normal");
    doc.setFontSize(18);
    doc.text("GIL JAKAN", 45, 18);

    doc.setFont("amiri", "normal");
    doc.setFontSize(10);
    doc.text("ALUMINIUM & MENUISERIE", 45, 24);

    doc.setDrawColor(200);
    doc.line(14, 35, 196, 35);

    /* ───── REPORT TITLE ───── */

    doc.setFont("amiri", "normal");
    doc.setFontSize(14);
    doc.text("Rapport d'historique financier", 14, 45);

    doc.setFont("amiri", "normal");
    doc.setFontSize(10);
    doc.text(
      `Période : ${filters.month}/${filters.year}`,
      14,
      52
    );

    /* ───── TRANSACTIONS TABLE ───── */

    autoTable(doc, {
      startY: 60,
      head: [["Date", "Catégorie", "Description", "Montant"]],
      body: transactions.map((t) => [
        new Date(t.date).toLocaleDateString("fr-FR"),
        t.category.toUpperCase(),
        t.description,
        `${t.type === "plus" ? "+" : "-"}${t.amount} DH`,
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: 0,
        font: "amiri"
      },
      styles: {
        fontSize: 9,
        font: "amiri"
      },
    });

    /* ───── SUMMARY ───── */

    const finalY = doc.lastAutoTable.finalY + 15;

    doc.setFont("amiri", "normal");
    doc.setFontSize(12);
    doc.text("Résumé financier", 140, finalY);

    doc.setFont("amiri", "normal");

    doc.text("Total entrées :", 120, finalY + 10);
    doc.text(`${totalIn.toLocaleString()} DH`, 190, finalY + 10, {
      align: "right",
    });

    doc.text("Total sorties :", 120, finalY + 18);
    doc.text(`${totalOut.toLocaleString()} DH`, 190, finalY + 18, {
      align: "right",
    });

    doc.setFont("amiri", "normal");
    doc.text("Solde total :", 120, finalY + 28);
    doc.text(`${(totalIn - totalOut).toLocaleString()} DH`, 190, finalY + 28, {
      align: "right",
    });

    /* ───── FOOTER ───── */

    doc.setDrawColor(200);
    doc.line(14, 285, 196, 285);

    doc.setFontSize(8);
    doc.setFont("amiri", "normal");
    doc.text(
      "Document généré par le système de gestion GIL JAKAN",
      105,
      292,
      { align: "center" }
    );

    doc.save(`Historique_GilJakan_${filters.year}_${filters.month}.pdf`);
  };

  return (
    <Container fluid className="py-4">
      <h2 className="jakan-title mb-4">HISTORIQUE <span className="text-jakan">BANCAIRE</span></h2>

      <Row className="g-3 mb-4">
        <Col md={4}><div className="finance-stat-card balance p-4 shadow">
            <div className="small fw-bold opacity-75">SOLDE PÉRIODE</div>
            <h2 className="fw-bold m-0 fs-1">{(totalIn - totalOut).toLocaleString()} DH</h2>
        </div></Col>
        <Col md={4}><div className="finance-stat-card income p-4 shadow">
            <div className="small fw-bold opacity-75 text-white">REVENUS (+)</div>
            <h2 className="fw-bold m-0 fs-1 text-white">{totalIn.toLocaleString()} DH</h2>
        </div></Col>
        <Col md={4}><div className="finance-stat-card expense p-4 shadow">
            <div className="small fw-bold opacity-75 text-white">DÉPENSES (-)</div>
            <h2 className="fw-bold m-0 fs-1 text-white">{totalOut.toLocaleString()} DH</h2>
        </div></Col>
      </Row>

      {/* ── FILTERS BAR (CLEAN & SMALL) ── */}
      <div className="d-flex gap-2 mb-4 flex-wrap align-items-center bg-body p-3 rounded-4 shadow-sm border">
        <Filter size={18} className="text-muted me-1" />
        
        <Form.Select className="filter-pill w-auto" value={filters.year} onChange={e => setFilters({...filters, year: e.target.value, month: 'all'})}>
            <option value="all">Toutes les Années</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
        </Form.Select>

        <Form.Select className="filter-pill w-auto" value={filters.month} disabled={filters.year === 'all'} onChange={e => setFilters({...filters, month: e.target.value})}>
            <option value="all">Tous les Mois</option>
            {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => <option key={m} value={m}>Mois {m}</option>)}
        </Form.Select>

        <Form.Select className="filter-pill w-auto" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
            <option value="">Tous les flux</option>
            <option value="plus">Entrées (+)</option>
            <option value="minus">Sorties (-)</option>
        </Form.Select>

        <Form.Select className="filter-pill w-auto" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
            <option value="">Toutes catégories</option>
            {uniqueCats.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </Form.Select>

        <div className="search-box-jakan" style={{ position: 'relative', width: '250px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <Form.Control 
              placeholder="Rechercher nom..." 
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              style={{ paddingLeft: '35px' }}
              className="filter-pill"
            />
        </div>
        

        <Button variant="danger" size="sm" className="ms-auto fw-bold rounded-3 px-3 d-flex align-items-center gap-2" onClick={generatePDF}>
            <FileText size={16}/> EXPORTER PDF
        </Button>
      </div>

      {/* ── TABLE ── */}
      <div className="jakan-table shadow-sm bg-body border rounded-4 overflow-hidden">
        <Table hover responsive className="m-0 align-middle">
          <thead>
            <tr>
              <th className="ps-4">Date</th>
              <th>Catégorie</th>
              <th>Désignation</th>
              <th className="text-center">Montant</th>
              <th className="text-center">Flux</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? <tr><td colSpan="5" className="text-center p-5 text-muted">Aucune donnée trouvée.</td></tr> : currentItems.map(t => (
              <tr key={t._id}>
                <td className="ps-4">
                    <div className="fw-bold small text-title">{new Date(t.date).toLocaleDateString('fr-FR')}</div>
                </td>
                <td><Badge bg="primary bg-opacity-10" className="text-primary text-uppercase px-2 py-1">{t.category}</Badge></td>
                <td className="small text-muted">{t.description}</td>
                <td className={`text-center fw-bold fs-5 ${t.type === 'plus' ? 'text-success' : 'text-danger'}`}>
                    {t.type === 'plus' ? '+' : '−'}{t.amount.toLocaleString()} DH
                </td>
                <td className="text-center">
                    {t.type === 'plus' ? <ArrowUpRight className="text-success" /> : <ArrowDownLeft className="text-danger" />}
                </td>
                <td className="text-end pe-4">
                    <div className="d-flex justify-content-end gap-1">
                        <Button variant="link" className="text-primary p-0" onClick={() => handleEditClick(t)}><Edit3 size={18}/></Button>
                        <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteClick(t)}><Trash2 size={18}/></Button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* ── PAGINATION ── */}
        <div className="p-3 border-top d-flex justify-content-between align-items-center bg-body">
            <small className="text-muted fw-bold">Page {currentPage} / {totalPages || 1}</small>
            <div className="d-flex gap-2">
                <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={18}/></button>
                <button className="pagination-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={18}/></button>
            </div>
        </div>
      </div>
      {/* EDIT MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold fs-5">Modifier Transaction</Modal.Title></Modal.Header>
        <Form onSubmit={handleUpdate}>
          <Modal.Body className="pt-0">
            <Form.Group className="mb-2">
                <Form.Label className="x-small fw-bold text-muted">DATE</Form.Label>
                <Form.Control type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
                <Form.Label className="x-small fw-bold text-muted">CATÉGORIE</Form.Label>
                <Form.Control value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-2">
                <Form.Label className="x-small fw-bold text-muted">DÉSIGNATION</Form.Label>
                <Form.Control value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label className="x-small fw-bold text-muted">MONTANT (DH)</Form.Label>
                <Form.Control type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 fw-bold shadow">ENREGISTRER</Button>
          </Modal.Body>
        </Form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered size="sm">
        <Form onSubmit={confirmDelete}>
          <Modal.Body className="p-4 text-center">
              <AlertTriangle size={40} className="text-danger mb-3" />
              <h5 className="fw-bold">Supprimer cette transaction ?</h5>
              <p className="small text-muted mb-2">Cette action nécessite votre mot de passe administrateur.</p>
              
              {deleteError && (
                  <div className="alert alert-danger py-2 small fw-bold mb-3">
                      <XCircle size={16} className="me-1" /> {deleteError}
                  </div>
              )}

              {selectedTransaction?.category === 'Salaire' && (
                  <div className="alert alert-warning py-2 small fw-bold mb-3 text-dark text-start">
                      <AlertTriangle size={16} className="me-2"/>
                      Attention: La suppression d'un salaire déverrouillera le pointage du mois correspondant.
                  </div>
              )}

              {selectedTransaction && (
                  <div className="bg-light rounded-3 p-3 mb-3 text-start">
                      <div className="small text-muted">Désignation</div>
                      <div className="fw-bold small">{selectedTransaction.description}</div>
                      <div className="small text-muted mt-2">Montant</div>
                      <div className="fw-bold text-danger">{selectedTransaction.amount?.toLocaleString()} DH</div>
                  </div>
              )}

              <Form.Group className="mb-3">
                  <Form.Control 
                      type="password"
                      placeholder="Mot de passe admin"
                      required
                      value={deletePassword}
                      onChange={e => setDeletePassword(e.target.value)}
                      className="bg-light border-0 text-center fw-bold"
                      autoFocus
                  />
              </Form.Group>

              <div className="d-grid gap-2">
                  <Button variant="danger" type="submit" className="fw-bold">CONFIRMER SUPPRESSION</Button>
                  <Button variant="light" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
              </div>
          </Modal.Body>
        </Form>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast show={toast.show} autohide delay={3000} onClose={() => setToast({...toast, show:false})} bg={toast.variant} className="text-white border-0 shadow">
          <Toast.Body className="fw-bold d-flex align-items-center gap-2">
            {toast.variant === 'success' ? <CheckCircle size={18}/> : <XCircle size={18}/>} {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default History;