import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Form, Button } from 'react-bootstrap';
import { Wallet, ArrowUpRight, ArrowDownLeft, Filter, ChevronLeft, ChevronRight, FileText, Search } from 'lucide-react';
import api from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Finance.css';

const History = () => {
  const [transactions, setTransactions] = useState([]);
  const [uniqueCats, setUniqueCats] = useState([]); // Real categories from DB
  const [years, setYears] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filters, setFilters] = useState({ type: '', category: '', year: 'all', month: 'all' , search: '' });

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
    const logoUrl = "/logo.jpg";

    /* ───── HEADER ───── */

    try {
      doc.addImage(logoUrl, "JPG", 14, 10, 25, 25);
    } catch (e) {}

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("GIL JAKAN", 45, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("ALUMINIUM & MENUISERIE", 45, 24);

    doc.setDrawColor(200);
    doc.line(14, 35, 196, 35);

    /* ───── REPORT TITLE ───── */

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Rapport d'historique financier", 14, 45);

    doc.setFont("helvetica", "normal");
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
      },
      styles: {
        fontSize: 9,
      },
    });

    /* ───── SUMMARY ───── */

    const finalY = doc.lastAutoTable.finalY + 15;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Résumé financier", 140, finalY);

    doc.setFont("helvetica", "normal");

    doc.text("Total entrées :", 120, finalY + 10);
    doc.text(`${totalIn.toLocaleString()} DH`, 190, finalY + 10, {
      align: "right",
    });

    doc.text("Total sorties :", 120, finalY + 18);
    doc.text(`${totalOut.toLocaleString()} DH`, 190, finalY + 18, {
      align: "right",
    });

    doc.setFont("helvetica", "bold");
    doc.text("Solde total :", 120, finalY + 28);
    doc.text(`${(totalIn - totalOut).toLocaleString()} DH`, 190, finalY + 28, {
      align: "right",
    });

    /* ───── FOOTER ───── */

    doc.setDrawColor(200);
    doc.line(14, 285, 196, 285);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
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
              <th className="text-end pe-4">Flux</th>
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
                <td className="text-end pe-4">
                    {t.type === 'plus' ? <ArrowUpRight className="text-success" /> : <ArrowDownLeft className="text-danger" />}
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
    </Container>
  );
};

export default History;