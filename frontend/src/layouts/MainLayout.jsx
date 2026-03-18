import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';
import { Menu, X } from 'lucide-react'; // Icons for mobile menu

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="d-flex min-vh-100 bg-body-tertiary overflow-hidden">
      
      {/* ── MOBILE OVERLAY ── */}
      {isSidebarOpen && (
        <div 
          className="position-fixed inset-0 bg-black bg-opacity-50 d-lg-none" 
          style={{ zIndex: 1040, top: 0, bottom: 0, left: 0, right: 0 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <div className={`sidebar-wrapper ${isSidebarOpen ? 'show' : ''}`}>
        <Sidebar closeMenu={() => setSidebarOpen(false)} />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <header className="d-flex align-items-center bg-body border-bottom px-3 d-lg-none" style={{ height: '60px' }}>
            <button className="btn border-0 p-0 text-jakan" onClick={() => setSidebarOpen(true)}>
                <Menu size={28} />
            </button>
            <h5 className="m-0 ms-3 jakan-title text-jakan">AlumGest</h5>
        </header>
        
        <TopNavbar />
        
        <main className="p-3 p-lg-4 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;