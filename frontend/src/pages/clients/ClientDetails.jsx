import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Button, Badge } from 'react-bootstrap';
import { ArrowLeft, UserCircle, Phone, Mail, MapPin, FolderKanban } from 'lucide-react';
import api from '../../services/api';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/clients/${id}`);
      setClient(res.data.client);
      setProjects(res.data.projects);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (!client) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <Container fluid className="py-4">
      <div className="d-flex align-items-center mb-4 gap-3">
        <Button variant="light" className="btn-icon" onClick={() => navigate('/clients')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h2 className="jakan-title m-0 d-flex align-items-center gap-2">
            <UserCircle size={28} className="text-primary" />
            {client.name}
          </h2>
        </div>
      </div>

      <Row className="g-4 mb-4">
        <Col md={12}>
          <Card className="shadow-sm border-0 rounded-4 p-4">
            <h5 className="fw-bold mb-3 text-muted">Informations de Contact</h5>
            <div className="d-flex flex-wrap gap-4">
              <div className="d-flex align-items-center gap-2">
                <Phone size={18} className="text-primary"/>
                <span className="fw-bold">{client.phone || '-'}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <Mail size={18} className="text-primary"/>
                <span className="fw-bold">{client.email || '-'}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <MapPin size={18} className="text-primary"/>
                <span className="fw-bold">{client.address || '-'}</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
        <h4 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
          <FolderKanban size={20} className="text-primary"/> 
          Chantiers du Client ({projects.length})
        </h4>
      </div>

      <div className="jakan-table shadow-sm bg-body border rounded-4 overflow-hidden">
        <Table hover responsive className="m-0 align-middle">
          <thead>
            <tr>
              <th className="ps-4">Nom du Projet</th>
              <th>Statut</th>
              <th>Date de création</th>
              <th>Prix Total</th>
              <th>Avance</th>
              <th className="text-center pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr><td colSpan="6" className="text-center p-5 text-muted">Aucun chantier associé.</td></tr>
            ) : (
              projects.map(p => (
                <tr key={p._id}>
                  <td className="ps-4 fw-bold">{p.projectName}</td>
                  <td>
                    <Badge bg={p.status === 'completed' ? 'success' : 'primary'} className="px-2 py-1">
                      {p.status === 'completed' ? 'Terminé' : 'En Cours'}
                    </Badge>
                  </td>
                  <td className="text-muted small">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="fw-bold">{p.totalPrice?.toLocaleString() || 0} DH</td>
                  <td className="fw-bold text-success">{p.advancePayment?.toLocaleString() || 0} DH</td>
                  <td className="text-center pe-4">
                    <Button as={Link} to={`/projects/details/${p._id}`} variant="light" size="sm" className="btn-icon">
                      Voir Chantier
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </Container>
  );
};

export default ClientDetails;
