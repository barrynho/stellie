import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SignatureCanvas from '../components/SignatureCanvas';
import { Heart, FileCheck, User, Calendar, Mail, Phone, ShieldAlert } from 'lucide-react';

const SignContract = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [contract, setContract] = useState(null);
  const [partnerSigned, setPartnerSigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [signature, setSignature] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchContract = async () => {
      if (!token) {
        setError('Lien de signature invalide ou manquant.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/contracts/token/${token}`);
        const data = await response.json();

        if (response.ok) {
          setContract(data.contract);
          if (data.contract.statut === 'Signe') {
            setPartnerSigned(true);
          }
        } else {
          setError(data.message || 'Contrat introuvable.');
        }
      } catch (err) {
        console.error(err);
        setError('Impossible de se connecter au serveur pour charger le contrat.');
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [token, API_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!acceptTerms) {
      setError("Vous devez cocher la case pour accepter les termes du contrat.");
      return;
    }

    if (!signature) {
      setError("Veuillez dessiner votre signature dans la zone blanche.");
      return;
    }

    setSubmitLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/contracts/token/${token}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nom,
          prenom,
          date_naissance: dateNaissance,
          email,
          telephone,
          signature
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la signature.');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="card-icon" style={{ animation: 'pulse 1.5s infinite', marginBottom: '1rem' }}>
          <Heart size={32} fill="currentColor" />
        </div>
        <p>Chargement du contrat d'amour...</p>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="sign-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="glass-panel" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <div className="card-icon" style={{ margin: '0 auto 1.5rem', background: 'rgba(220, 53, 69, 0.1)', color: '#dc3545', border: '1px solid rgba(220, 53, 69, 0.2)' }}>
            <ShieldAlert size={32} />
          </div>
          <h2>Erreur</h2>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0 2rem' }}>{error}</p>
          <a href="/" className="btn btn-secondary">Retour à l'accueil</a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="sign-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="glass-panel" style={{ maxWidth: '550px', textAlign: 'center', border: '1px solid rgba(40,167,69,0.3)', boxShadow: '0 0 30px rgba(40,167,69,0.15)' }}>
          <div className="card-icon" style={{ margin: '0 auto 1.5rem', background: 'rgba(40, 167, 69, 0.1)', color: '#28a745', border: '1px solid rgba(40, 167, 69, 0.2)', boxShadow: '0 0 15px rgba(40, 167, 69, 0.3)' }}>
            <FileCheck size={32} />
          </div>
          <h2>Félicitations !</h2>
          <p style={{ fontSize: '1.1rem', margin: '1rem 0' }}>
            Vous venez de signer le contrat d'amour officiel avec <strong>{contract?.prenom_createur} {contract?.nom_createur}</strong> !
          </p>
          <div style={{ margin: '2rem 0', animation: 'pulse 2s infinite' }}>
            <Heart size={64} fill="var(--accent-rose)" style={{ color: 'var(--accent-rose)' }} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Le statut a été mis à jour dans le tableau de bord du créateur. Il ou elle peut maintenant télécharger la version officielle du contrat signé en PDF.
          </p>
        </div>
      </div>
    );
  }

  if (partnerSigned) {
    return (
      <div className="sign-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="glass-panel" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <div className="card-icon" style={{ margin: '0 auto 1.5rem' }}>
            <FileCheck size={32} />
          </div>
          <h2>Contrat déjà signé</h2>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0 2rem' }}>
            Ce contrat d'amour ({contract?.numero}) liant <strong>{contract?.prenom_createur} {contract?.nom_createur}</strong> a déjà été signé par son ou sa partenaire.
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Le créateur peut consulter et télécharger le document officiel depuis son tableau de bord.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sign-page">
      <div className="sign-header-meta">
        <div className="card-icon">
          <Heart size={32} fill="currentColor" />
        </div>
        <h1 style={{ background: 'linear-gradient(45deg, #fff, var(--accent-rose))', WebkitBackgroundClip: text => 'text', WebkitTextFillColor: 'transparent' }}>
          Invitation de Signature
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px' }}>
          <strong>{contract.prenom_createur} {contract.nom_createur}</strong> vous invite à officialiser votre relation en signant ce contrat d'amour. Lisez attentivement les clauses avant d'apposer votre signature.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem', alignItems: 'start', marginTop: '2rem' }}>
        
        {/* Left: Contract visual card preview */}
        <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(212,175,55,0.2)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
              Contrat de Relation
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontFamily: 'monospace' }}>
              {contract.numero}
            </span>
          </div>

          <div style={{ margin: '1.5rem 0', padding: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Créateur :</span>
              <strong>{contract.prenom_createur} {contract.nom_createur}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Début de la relation :</span>
              <strong>{formatDate(contract.date_relation)}</strong>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>Clauses d'Engagement :</h4>
            <div style={{ 
              background: 'rgba(0,0,0,0.3)', 
              padding: '1.25rem', 
              borderRadius: '8px', 
              fontSize: '0.9rem', 
              maxHeight: '220px', 
              overflowY: 'auto',
              whiteSpace: 'pre-line',
              borderLeft: '3px solid var(--accent-rose)',
              lineHeight: '1.5'
            }}>
              {contract.clauses}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              Signature du créateur :
            </span>
            <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={contract.signature_createur} alt="Signature Créateur" style={{ maxHeight: '70px', maxWidth: '200px', objectFit: 'contain' }} />
            </div>
          </div>
        </div>

        {/* Right: Partner Input details and signature canvas */}
        <form onSubmit={handleSubmit} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', color: 'var(--text-main)' }}>
            Vos Informations
          </h2>

          {error && <div className="toast toast-error" style={{ position: 'static', width: '100%', animation: 'none' }}>{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="p_prenom">Prénom</label>
              <input
                id="p_prenom"
                type="text"
                className="form-control"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Votre prénom"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="p_nom">Nom</label>
              <input
                id="p_nom"
                type="text"
                className="form-control"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Votre nom"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="p_naissance">Date de naissance</label>
            <div style={{ position: 'relative' }}>
              <input
                id="p_naissance"
                type="date"
                className="form-control"
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                style={{ width: '100%' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="p_email">Adresse Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                id="p_email"
                type="email"
                className="form-control"
                placeholder="partenaire@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="p_tel">Téléphone (optionnel)</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                id="p_tel"
                type="tel"
                className="form-control"
                placeholder="+33 6 00 00 00 00"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              Dessinez votre signature électronique :
            </label>
            <SignatureCanvas onSave={setSignature} />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '0.5rem' }}>
            <input
              type="checkbox"
              id="terms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              style={{ marginTop: '4px', cursor: 'pointer' }}
              required
            />
            <label htmlFor="terms" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
              J’accepte pleinement et de bon cœur les termes de cet engagement et déclare l'authenticité de mes sentiments.
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }} disabled={submitLoading}>
            {submitLoading ? 'Signature en cours...' : 'Signer officiellement le contrat'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default SignContract;
