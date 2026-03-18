import React, { useContext, useState } from 'react';
import { Nav, Accordion } from 'react-bootstrap';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FolderKanban, Wallet, 
  BarChart3, Settings, ChevronDown, ClipboardList ,Globe 
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  const location = useLocation();

  // Helper to check if a parent menu should be open based on URL
  const getActiveKey = () => {
    if (location.pathname.includes('/workers')) return '0';
    if (location.pathname.includes('/projects')) return '1';
    if (location.pathname.includes('/finance')) return '2';
    if (location.pathname.includes('/analytics')) return '3';
    return null;
  };

  return (
    <div className="jakan-sidebar shadow-sm border-end">
      <div className="sidebar-brand p-4 border-bottom mb-3 d-flex align-items-center gap-3">
          <img 
            src="/logo.jpg" 
            alt="logo"
            style={{ width: 40, height: 40, objectFit: "contain" }} 
            className="rounded"
          />
        <h4 className="m-0 fw-bold jakan-logo-text">GIL<span className="text-jakan"> JAKAN</span></h4>
      </div>

      <Nav className="flex-column px-3 flex-grow-1">
        {/* TABLEAU DE BORD DYNAMIC */}
        <Nav.Link as={NavLink} to={isAdmin ? "/dashboard" : "/my-stats"} className="nav-link-jakan mb-2">
          <LayoutDashboard size={20} className="me-3" /> {isAdmin ? "Tableau de Bord" : "Mon Dossier"}
        </Nav.Link>

        {isAdmin ? (
          <>
            {/* MENU : OUVRIERS */}
            <Accordion defaultActiveKey={getActiveKey()} className="sidebar-accordion mb-2">
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <div className="d-flex align-items-center"><Users size={20} className="me-3" /> Ouvriers</div>
                </Accordion.Header>
                <Accordion.Body className="py-0 ps-5">
                  <Nav.Link as={NavLink} to="/workers/all" className="sub-link-jakan">Liste des Ouvriers</Nav.Link>
                  <Nav.Link as={NavLink} to="/workers/attendance" className="sub-link-jakan">Pointage Quotidien</Nav.Link>
                  <Nav.Link as={NavLink} to="/workers/payroll" className="sub-link-jakan">Gestion des Paies</Nav.Link>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

            {/* MENU : PROJETS */}
            <Accordion defaultActiveKey={getActiveKey()} className="sidebar-accordion mb-2">
              <Accordion.Item eventKey="1">
                <Accordion.Header>
                  <div className="d-flex align-items-center"><FolderKanban size={20} className="me-3" /> Chantiers</div>
                </Accordion.Header>
                <Accordion.Body className="py-0 ps-5">
                  <Nav.Link as={NavLink} to="/projects/active" className="sub-link-jakan">Projets en Cours</Nav.Link>
                  <Nav.Link as={NavLink} to="/projects/completed" className="sub-link-jakan">Chantiers Terminés</Nav.Link>
                  <Nav.Link as={NavLink} to="/projects/catalog" className="sub-link-jakan">Catalogue de Prix</Nav.Link>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

            {/* MENU : FINANCE */}
            <Accordion defaultActiveKey={getActiveKey()} className="sidebar-accordion mb-2">
              <Accordion.Item eventKey="2">
                <Accordion.Header>
                  <div className="d-flex align-items-center"><Wallet size={20} className="me-3" /> Finances</div>
                </Accordion.Header>
                <Accordion.Body className="py-0 ps-5">
                  <Nav.Link as={NavLink} to="/finance/history" className="sub-link-jakan">Historique Caisse</Nav.Link>
                  <Nav.Link as={NavLink} to="/finance/extra" className="sub-link-jakan">Flux Hors Chantier</Nav.Link>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

            {/* MENU : ANALYTIQUES */}
            <Accordion defaultActiveKey={getActiveKey()} className="sidebar-accordion mb-2">
              <Accordion.Item eventKey="3">
                <Accordion.Header>
                  <div className="d-flex align-items-center"><BarChart3 size={20} className="me-3" /> Analytiques</div>
                </Accordion.Header>
                <Accordion.Body className="py-0 ps-5">
                  <Nav.Link as={NavLink} to="/analytics/overview" className="sub-link-jakan">Vue Globale</Nav.Link>
                  <Nav.Link as={NavLink} to="/analytics/monthly" className="sub-link-jakan">Rapport Mensuel</Nav.Link>
                  <Nav.Link as={NavLink} to="/analytics/yearly" className="sub-link-jakan">Comparaison Annuelle</Nav.Link>
                  <Nav.Link as={NavLink} to="/analytics/workers" className="sub-link-jakan">Performance Équipe</Nav.Link>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>



            <Accordion defaultActiveKey={getActiveKey()} className="sidebar-accordion mb-2">
              <Accordion.Item eventKey="3">
                <Accordion.Header>
                  <div className="d-flex align-items-center"><Globe size={20} className="me-3" /> website</div>
                </Accordion.Header>
                <Accordion.Body className="py-0 ps-5">
                  <Nav.Link as={NavLink} to="/portfolio-admin" className="sub-link-jakan">control</Nav.Link>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>


          </>
        ) : (
          <>

          </>
        )}

        {/* PROFIL - Common */}
        <Nav.Link as={NavLink} to="/settings" className="nav-link-jakan mt-auto mb-4 border-top pt-3">
          <Settings size={20} className="me-3" /> {isAdmin ? 'Profil Gérant' : 'Mon Dossier'}
        </Nav.Link>
      </Nav>
    </div>
  );
};

export default Sidebar;