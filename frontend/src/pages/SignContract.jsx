import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SignatureCanvas from '../components/SignatureCanvas';
import { Heart, FileCheck, Mail, Phone, ShieldAlert, XCircle, Download } from 'lucide-react';

const SignContract = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decision, setDecision] = useState('');

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [signature, setSignature] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submittedDecision, setSubmittedDecision] = useState(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

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
          if (data.contract.decision === 'accepted') {
            setSubmittedDecision('accepted');
          } else if (data.contract.decision === 'declined') {
            setSubmittedDecision('declined');
          }
          if (data.partner) {
            setNom(data.partner.nom || '');
            setPrenom(data.partner.prenom || '');
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

  const handleDecision = async (selectedDecision) => {
    setError('');
    setDecision(selectedDecision);

    if (!acceptTerms) {
      setError("Vous devez cocher la case pour accepter les termes du contrat.");
      return;
    }

    if (selectedDecision === 'accepted' && !signature) {
      setError('Veuillez dessiner votre signature pour accepter le contrat.');
      return;
    }

    setSubmitLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/contracts/token/${token}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: selectedDecision,
          nom,
          prenom,
          date_naissance: dateNaissance,
          email,
          telephone,
          signature: selectedDecision === 'accepted' ? signature : '',
          message: selectedDecision === 'declined' ? 'Le partenaire a refusé le contrat.' : ''
        })
      });

      let data = {};
      try {
        data = await response.json();
      } catch (parseError) {
        data = { message: 'Réponse inattendue du serveur.' };
      }

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du traitement du contrat.');
      }

      setSubmittedDecision(selectedDecision);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!contract) return;

    const element = document.getElementById('sign-contract-download');
    if (!element) {
      setPdfGenerating(false);
      setError('Impossible de générer le PDF à partir du contenu du contrat.');
      return;
    }

    setPdfGenerating(true);

    const opt = {
      margin: 0.3,
      filename: `Contrat_Amour_${contract.numero}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    const generate = () => {
      window.html2pdf().from(element).set(opt).save()
        .then(() => setPdfGenerating(false))
        .catch((err) => {
          console.error(err);
          setPdfGenerating(false);
          setError('Erreur lors du téléchargement du PDF.');
        });
    };

    if (window.html2pdf) {
      generate();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = generate;
    script.onerror = () => {
      setError("Erreur lors du chargement de l'outil PDF.");
      setPdfGenerating(false);
    };
    document.body.appendChild(script);
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
      <div className="sign-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="card-icon" style={{ animation: 'pulse 1.5s infinite', marginBottom: '1rem' }}>
          <Heart size={32} fill="currentColor" />
        </div>
        <p>Chargement du contrat d'amour...</p>
      </div>
    );
  }

  if (error && !submittedDecision) {
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

  if (submittedDecision) {
    const isAccepted = submittedDecision === 'accepted';
    return (
      <div className="sign-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className={`glass-panel ${isAccepted ? 'decision-success' : 'decision-danger'}`} style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div className={`card-icon ${isAccepted ? 'decision-icon-success' : 'decision-icon-danger'}`} style={{ margin: '0 auto 1.5rem' }}>
            {isAccepted ? <FileCheck size={32} /> : <XCircle size={32} />}
          </div>
          <h2>{isAccepted ? 'Contrat accepté' : 'Contrat refusé'}</h2>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0 2rem' }}>
            {isAccepted
              ? `Vous avez accepté le contrat de ${contract?.prenom_createur} ${contract?.nom_createur}. Le créateur voit maintenant l'état "Accepté".`
              : `Vous avez refusé le contrat de ${contract?.prenom_createur} ${contract?.nom_createur}. Le créateur voit maintenant l'état "Refusé".`}
          </p>
          {isAccepted && (
            <div style={{ marginBottom: '1rem' }}>
              <button type="button" className="btn btn-gold" onClick={handleDownloadPDF} disabled={pdfGenerating}>
                <Download size={16} /> {pdfGenerating ? 'Génération du PDF...' : 'Télécharger le contrat'}
              </button>
            </div>
          )}
          <div id="sign-contract-download" style={{ position: 'fixed', left: '0', top: '0', width: '794px', opacity: 0, pointerEvents: 'none', zIndex: -9999, background: '#fff', color: '#111', padding: '24px', textAlign: 'left' }}>
            <h2 style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Contrat d'Amour</h2>
            <p style={{ textAlign: 'center', marginBottom: '1rem' }}>Contrat N° : {contract?.numero}</p>
            <p><strong>Créé par :</strong> {contract?.prenom_createur} {contract?.nom_createur}</p>
            <p><strong>Partenaire :</strong> {prenom} {nom}</p>
            <p><strong>Date de début de la relation :</strong> {formatDate(contract?.date_relation)}</p>
            <p><strong>Clauses :</strong></p>
            <div style={{ whiteSpace: 'pre-wrap' }}>{contract?.clauses}</div>
            <p style={{ marginTop: '1.5rem' }}><strong>Signature du partenaire :</strong></p>
            {signature ? <img src={signature} alt="Signature du partenaire" style={{ maxHeight: '80px', maxWidth: '220px', border: '1px solid #ddd', padding: '8px' }} /> : <p>Signature non fournie</p>}
          </div>
          <a href="/" className="btn btn-secondary">Retour à l'accueil</a>
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
        <h1 style={{ background: 'linear-gradient(45deg, #fff, var(--accent-rose))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Invitation de réponse
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px' }}>
          <strong>{contract?.prenom_createur} {contract?.nom_createur}</strong> vous invite à répondre à ce contrat. Vous pouvez accepter avec signature ou refuser sans signature.
        </p>
      </div>

      <div className="sign-grid">
        <div className="glass-panel sign-preview-card">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
              Contrat de Relation
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontFamily: 'monospace' }}>
              {contract?.numero}
            </span>
          </div>

          <div className="contract-summary">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Créateur :</span>
              <strong>{contract?.prenom_createur} {contract?.nom_createur}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Début de la relation :</span>
              <strong>{formatDate(contract?.date_relation)}</strong>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>Clauses d'Engagement :</h4>
            <div className="contract-clauses-preview">
              {contract?.clauses}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              Signature du créateur :
            </span>
            <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px', textAlign: 'center', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={contract?.signature_createur} alt="Signature Créateur" style={{ maxHeight: '70px', maxWidth: '200px', objectFit: 'contain' }} />
            </div>
          </div>
        </div>

        <div className="glass-panel sign-form-card">
          <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', color: 'var(--text-main)' }}>
            Vos Informations
          </h2>

          {error && <div className="toast toast-error" style={{ position: 'static', width: '100%', animation: 'none' }}>{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="p_prenom">Prénom</label>
              <input id="p_prenom" type="text" className="form-control" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Votre prénom" required />
            </div>
            <div className="form-group">
              <label htmlFor="p_nom">Nom</label>
              <input id="p_nom" type="text" className="form-control" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="p_naissance">Date de naissance</label>
            <input id="p_naissance" type="date" className="form-control" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="p_email">Adresse Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input id="p_email" type="email" className="form-control" placeholder="partenaire@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: '2.5rem', width: '100%' }} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="p_tel">Téléphone (optionnel)</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
              <input id="p_tel" type="tel" className="form-control" placeholder="+241 06 00 00 00" value={telephone} onChange={(e) => setTelephone(e.target.value)} style={{ paddingLeft: '2.5rem', width: '100%' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              Signature électronique (obligatoire pour accepter)
            </label>
            <SignatureCanvas onSave={setSignature} />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginTop: '0.5rem' }}>
            <input type="checkbox" id="terms" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} style={{ marginTop: '4px', cursor: 'pointer' }} required />
            <label htmlFor="terms" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
              J'accepte pleinement les termes de cet engagement et confirme l'authenticité de mes informations.
            </label>
          </div>

          <div className="decision-actions">
            <button type="button" className="btn btn-secondary" onClick={() => handleDecision('declined')} disabled={submitLoading}>
              {submitLoading && decision === 'declined' ? 'Traitement...' : 'Refuser'}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => handleDecision('accepted')} disabled={submitLoading}>
              {submitLoading && decision === 'accepted' ? 'Traitement...' : 'Accepter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignContract;