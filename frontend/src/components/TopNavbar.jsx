import React, { useContext } from 'react';
import { Navbar, Container, Nav, NavDropdown, Button } from 'react-bootstrap';
import { Sun, Moon, Globe, LogOut } from 'lucide-react';
import { UIContext } from '../context/UIContext';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const TopNavbar = () => {
  const { theme, toggleTheme, changeLanguage } = useContext(UIContext);
  const { user, logout } = useContext(AuthContext);
  const { t } = useTranslation();

  return (
    <Navbar expand="lg" className="border-bottom sticky-top bg-body">
      <Container fluid>
        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav className="ms-auto align-items-center gap-2">


            {/* Theme Toggle */}
            <Button variant="link" onClick={toggleTheme} className="text-secondary p-2">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </Button>

            {/* Profile & Logout */}
            <NavDropdown title={user?.name} id="user-nav" align="end">
              <NavDropdown.Item onClick={logout} className="text-danger d-flex align-items-center gap-2">
                <LogOut size={16} /> {t('logout')}
              </NavDropdown.Item>
            </NavDropdown>

          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default TopNavbar;