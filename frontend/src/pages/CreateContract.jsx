import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import SignatureCanvas from '../components/SignatureCanvas';
import { ArrowLeft, FileText, Calendar, User, Heart, Mail, Phone } from 'lucide-react';

const DEFAULT_CLAUSES = `1. Fidélité & Respect : Nous promettons de nous aimer, de nous respecter et de nous soutenir mutuellement à travers toutes les saisons de la vie.
2. Communication Bienveillante : Nous nous engageons à communiquer ouvertement, avec honnêteté et empathie, en évitant les reproches et en favorisant l'écoute.
3. Temps de Qualité : Nous consacrerons un moment privilégié ensemble chaque semaine pour entretenir notre complicité et notre amour.
4. Soutien des Rêves : Nous célébrerons les succès de l'autre et nous nous encouragerons mutuellement à réaliser nos aspirations personnelles et professionnelles.
5. Résolution des Conflits : En cas de désaccord, nous ferons preuve de patience, de pardon et d'écoute pour trouver des solutions ensemble avant de dormir.`;

const CreateContract = () => {
  const { user, token, API_URL } = useContext(AuthContext);
  const navigate = useNavigate();

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [dateRelation, setDateRelation] = useState('');
  const [clauses, setClauses] = useState(DEFAULT_CLAUSES);
  const [signature, setSignature] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-fill from user context if available
  useEffect(() => {
    if (user) {
      setNom(user.nom || '');
      setPrenom(user.prenom || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!signature) {
      setError('Veuillez signer le contrat dans le cadre ci-dessous.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nom_createur: nom,
          prenom_createur: prenom,
          email_createur: email,
          telephone_createur: telephone,
          date_relation: dateRelation,
          clauses,
          signature_createur: signature
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création du contrat');
      }

      navigate('/');
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-page">
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> Retour au tableau de bord
        </Link>
      </div>

      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Créer un Contrat d'Amour</h1>
          <p className="page-subtitle">Remplissez les informations pour générer votre certificat d'engagement unique</p>
        </div>
      </div>

      {error && <div className="toast toast-error" style={{ position: 'static', marginBottom: '2rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Section 1: Vos informations */}
        <div>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--accent-gold)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} /> Vos Informations (Créateur)
          </h2>
          <div className="form-row">
            <div className="form-group">
              <label>Prénom</label>
              <input
                type="text"
                className="form-control"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                className="form-control"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Téléphone (optionnel)</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="tel"
                  className="form-control"
                  value={telephone}
                  placeholder="+33 6 12 34 56 78"
                  onChange={(e) => setTelephone(e.target.value)}
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Détails de la relation */}
        <div>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--accent-gold)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} /> La Relation
          </h2>
          <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
            <div className="form-group">
              <label>Date de début de la relation</label>
              <input
                type="date"
                className="form-control"
                value={dateRelation}
                onChange={(e) => setDateRelation(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Clauses du contrat */}
        <div>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--accent-gold)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> Clauses du Contrat
          </h2>
          <div className="form-group">
            <label>Modifiez ou personnalisez les termes de votre engagement mutuel :</label>
            <textarea
              className="form-control"
              value={clauses}
              onChange={(e) => setClauses(e.target.value)}
              rows="6"
              required
            />
          </div>
        </div>

        {/* Section 4: Signature */}
        <div>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--accent-gold)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Heart size={18} /> Votre Signature
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Dessinez votre signature électronique dans la zone blanche ci-dessous avec votre souris ou votre doigt :
          </p>
          <div className="form-group">
            <SignatureCanvas onSave={setSignature} />
          </div>
        </div>

        {/* Validation */}
        <div style={{ marginTop: '1rem' }}>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
            {loading ? 'Création en cours...' : 'Créer et générer le lien de signature'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default CreateContract;
