import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { UIProvider } from './context/UIContext';

// Layouts & Components
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import AllWorkers from './pages/workers/AllWorkers';
import Attendance from './pages/workers/Attendance';
import Payroll from './pages/workers/Payroll';
import WorkerPayrollDetails from './pages/workers/WorkerPayrollDetails';
import WorkerProfile from './pages/workers/WorkerProfile';
import ClientDebts from './pages/clients/ClientDebts';
import ActiveProjects from './pages/projects/ActiveProjects';
import ProjectDetails from './pages/projects/ProjectDetails';
import CompletedProjects from './pages/projects/CompletedProjects'
import Catalog from './pages/projects/Catalog';
import History from './pages/finance/History';
import ExtraFinances from './pages/finance/ExtraFinances';
import FournisseursList from './pages/fournisseurs/FournisseursList';
import FournisseurDetails from './pages/fournisseurs/FournisseurDetails';
import ClientsList from './pages/clients/ClientsList';
import ClientDetails from './pages/clients/ClientDetails';

import Overview          from './pages/analytics/Overview';
import Monthly           from './pages/analytics/Monthly';
import Yearly            from './pages/analytics/Yearly';
import WorkerPerformance from './pages/analytics/WorkerPerformance';


import WorkerDashboard from './pages/workers/WorkerDashboard';

import ManagerProfile from './pages/ManagerProfile';
import PortfolioAdmin from './pages/PortfolioAdmin';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="vh-100 d-flex align-items-center justify-content-center bg-dark text-primary"><div className="spinner-border"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/my-stats" />;
  
  // This wraps the page content inside our Sidebar + Navbar layout
  return <MainLayout>{children}</MainLayout>;
};

function App() {
  return (
    <UIProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute adminOnly={true}><Dashboard /></ProtectedRoute>} />
            
            {/* Workers Routes */}
            <Route path="/workers/all" element={<ProtectedRoute adminOnly={true}><AllWorkers /></ProtectedRoute>} />
            <Route path="/workers/attendance" element={<ProtectedRoute adminOnly={true}><Attendance /></ProtectedRoute>} />
            <Route path="/workers/payroll" element={<ProtectedRoute adminOnly={true}><Payroll /></ProtectedRoute>} />
            <Route path="/workers/payroll/:workerId/:year/:month" element={<ProtectedRoute adminOnly={true}><WorkerPayrollDetails /></ProtectedRoute>} />
            <Route path="/workers/profile/:id" element={<ProtectedRoute adminOnly={true}><WorkerProfile /></ProtectedRoute>} />

            <Route path="/my-stats" element={<ProtectedRoute><WorkerDashboard /></ProtectedRoute>} />
            {/* Projects Routes */}
            <Route path="/projects/active" element={<ProtectedRoute adminOnly={true}><ActiveProjects /></ProtectedRoute>} />
            <Route path="/projects/completed" element={<ProtectedRoute adminOnly={true}><CompletedProjects /></ProtectedRoute>} />
            <Route path="/projects/details/:id" element={<ProtectedRoute adminOnly={true}><ProjectDetails /></ProtectedRoute>} />
            <Route path="/projects/catalog" element={<ProtectedRoute adminOnly={true}><Catalog /></ProtectedRoute>} />
            {/* finance Routes */}
            <Route path="/finance/history" element={<ProtectedRoute adminOnly={true}><History /></ProtectedRoute>} />
            <Route path="/finance/extra" element={<ProtectedRoute adminOnly={true}><ExtraFinances /></ProtectedRoute>} />

            {/* Fournisseurs Routes */}
            <Route path="/fournisseurs" element={<ProtectedRoute adminOnly={true}><FournisseursList /></ProtectedRoute>} />
            <Route path="/fournisseurs/:id" element={<ProtectedRoute adminOnly={true}><FournisseurDetails /></ProtectedRoute>} />

            {/* Clients Routes */}
            <Route path="/clients" element={<ProtectedRoute adminOnly={true}><ClientsList /></ProtectedRoute>} />
            <Route path="/clients/debts" element={<ProtectedRoute adminOnly={true}><ClientDebts /></ProtectedRoute>} />
            <Route path="/clients/:id" element={<ProtectedRoute adminOnly={true}><ClientDetails /></ProtectedRoute>} />

            {/* ── Analytics ── */}
            <Route path="/analytics/overview" element={<ProtectedRoute adminOnly><Overview /></ProtectedRoute>} />
            <Route path="/analytics/monthly"  element={<ProtectedRoute adminOnly><Monthly /></ProtectedRoute>} />
            <Route path="/analytics/yearly"   element={<ProtectedRoute adminOnly><Yearly /></ProtectedRoute>} />
            <Route path="/analytics/workers"  element={<ProtectedRoute adminOnly><WorkerPerformance /></ProtectedRoute>} />
            {/* ── Profile Management ── */}
            <Route path="/settings" element={<ProtectedRoute adminOnly={true}><ManagerProfile /></ProtectedRoute>} />
            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />

            <Route path="/portfolio-admin" element={<ProtectedRoute adminOnly><PortfolioAdmin/></ProtectedRoute>}/>
          </Routes>
        </Router>
    </UIProvider>
  );
}

export default App;