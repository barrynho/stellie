import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Plus, Copy, Check, ExternalLink, Calendar, Users, Share2, LogOut, Heart } from 'lucide-react';

const Dashboard = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const { token, logout, API_URL } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/contracts`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setContracts(data);
        } else {
          setError('Erreur lors du chargement des contrats.');
        }
      } catch (err) {
        console.error(err);
        setError('Impossible de se connecter au serveur.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchContracts();
    }
  }, [token, API_URL]);

  const copyToClipboard = (text, contractId) => {
    navigator.clipboard.writeText(text);
    setCopiedId(contractId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getShareLink = (contractToken) => {
    return `${window.location.origin}/signer?token=${contractToken}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Gérez et suivez vos contrats d'engagement mutuel</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/create" className="btn btn-primary">
            <Plus size={18} /> Nouveau Contrat
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary" title="Se déconnecter">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {error && <div className="toast toast-error" style={{ position: 'static', marginBottom: '2rem' }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="card-icon" style={{ margin: '0 auto 1rem', animation: 'pulse 1.5s infinite' }}>
            <Heart size={32} fill="currentColor" />
          </div>
          <p>Chargement de vos contrats...</p>
        </div>
      ) : contracts.length === 0 ? (
        <div className="empty-state">
          <Heart size={48} style={{ color: 'var(--accent-rose)', opacity: 0.7 }} />
          <h3>Aucun contrat pour le moment</h3>
          <p>Créez votre premier contrat de relation et envoyez le lien de signature à votre partenaire.</p>
          <Link to="/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Créer un contrat
          </Link>
        </div>
      ) : (
        <div className="dashboard-grid">
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
              Vos Contrats d'Amour
            </h2>
            <div className="contracts-list">
              {contracts.map((contract) => {
                const partnerSigned = contract.statut === 'Signe';
                const shareLink = getShareLink(contract.token);
                return (
                  <div key={contract.id} className="contract-card">
                    <div className="contract-info">
                      <span className="contract-num">{contract.numero}</span>
                      <span className="contract-partners">
                        {contract.prenom_createur} {contract.nom_createur} &{' '}
                        {partnerSigned ? `${contract.prenom_partenaire} ${contract.nom_partenaire}` : 'En attente du partenaire'}
                      </span>
                      <div className="contract-meta">
                        <span>
                          <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                          Créé le {formatDate(contract.created_at)}
                        </span>
                        <span>
                          <Users size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                          Relation : {formatDate(contract.date_relation)}
                        </span>
                      </div>

                      {/* Display share elements if pending */}
                      {!partnerSigned && (
                        <div className="share-box">
                          <span className="share-title">
                            <Share2 size={12} style={{ marginRight: '4px' }} />
                            Lien de signature partenaire :
                          </span>
                          <div className="share-link-group">
                            <input type="text" readOnly className="share-link-input" value={shareLink} />
                            <button
                              className="btn btn-secondary"
                              onClick={() => copyToClipboard(shareLink, contract.id)}
                              style={{ padding: '0.5rem 1rem' }}
                              title="Copier le lien"
                            >
                              {copiedId === contract.id ? <Check size={16} style={{ color: '#28a745' }} /> : <Copy size={16} />}
                            </button>
                          </div>
                          <div className="share-buttons">
                            <a
                              href={`https://wa.me/?text=Mon%20amour%2C%20signe%20notre%20contrat%20de%20relation%20ici%20%3A%20${encodeURIComponent(shareLink)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-share-icon btn-whatsapp"
                            >
                              WhatsApp
                            </a>
                            <a
                              href={`fb-messenger://share/?link=${encodeURIComponent(shareLink)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-share-icon btn-messenger"
                              onClick={(e) => {
                                // Fallback if protocol not supported
                                setTimeout(() => {
                                  window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareLink)}&app_id=291494448705007&redirect_uri=${encodeURIComponent(window.location.href)}`, '_blank');
                                }, 50);
                              }}
                            >
                              Messenger
                            </a>
                            <a
                              href={`mailto:?subject=Notre%20Contrat%20d'Amour&body=Mon%20amour%2C%20je%20t'invite%20%C3%A0%20lire%20et%20signer%20notre%20contrat%20de%20relation%20ici%20%3A%20${encodeURIComponent(shareLink)}`}
                              className="btn-share-icon btn-email"
                            >
                              Email
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                      <span className={`status-badge ${partnerSigned ? 'status-signed' : 'status-pending'}`}>
                        {partnerSigned ? 'Signé' : 'En attente'}
                      </span>
                      <Link to={`/contracts/${contract.id}`} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        <ExternalLink size={14} /> Voir les détails
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
