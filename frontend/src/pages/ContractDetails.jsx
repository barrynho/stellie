import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Download, Calendar, Mail, Phone, Heart } from 'lucide-react';

const ContractDetails = () => {
  const { id } = useParams();
  const { token, API_URL } = useContext(AuthContext);
  const navigate = useNavigate();

  const [contract, setContract] = useState(null);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => {
    const fetchContractDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/api/contracts/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setContract(data.contract);
          setPartner(data.partner);
        } else {
          setError('Impossible de récupérer les détails du contrat.');
        }
      } catch (err) {
        console.error(err);
        setError('Erreur lors de la connexion au serveur.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchContractDetails();
    }
  }, [id, token, API_URL]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleDownloadPDF = () => {
    setPdfGenerating(true);
    const element = document.getElementById('contract-certificate-print');
    if (!element) {
      setPdfGenerating(false);
      return;
    }

    const opt = {
      margin:       0.3,
      filename:     `Contrat_Amour_${contract.numero}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2.5, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // Load html2pdf from CDN dynamically to execute the render
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      window.html2pdf().from(element).set(opt).save()
        .then(() => setPdfGenerating(false))
        .catch(err => {
          console.error(err);
          setPdfGenerating(false);
        });
    };
    script.onerror = () => {
      setError("Erreur lors du chargement de l'outil PDF.");
      setPdfGenerating(false);
    };
    document.body.appendChild(script);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div className="card-icon" style={{ animation: 'pulse 1.5s infinite', marginBottom: '1rem' }}>
          <Heart size={32} fill="currentColor" />
        </div>
        <p>Chargement du certificat...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="details-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="glass-panel" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <h2>Erreur</h2>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0 2rem' }}>{error || 'Contrat introuvable.'}</p>
          <Link to="/" className="btn btn-secondary">Retour au tableau de bord</Link>
        </div>
      </div>
    );
  }

  const isSigned = contract.statut === 'Signe';

  // Get initials for wax seal (e.g. "J & M")
  const creatorInit = contract.prenom_createur.charAt(0).toUpperCase();
  const partnerInit = partner ? partner.prenom.charAt(0).toUpperCase() : '';
  const sealText = partner ? `${creatorInit} & ${partnerInit}` : creatorInit;

  return (
    <div className="details-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> Retour au tableau de bord
        </Link>
        {isSigned && (
          <button className="btn btn-gold" onClick={handleDownloadPDF} disabled={pdfGenerating}>
            <Download size={16} /> {pdfGenerating ? 'Génération du PDF...' : 'Télécharger le PDF'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isSigned ? '1fr 320px' : '1fr', gap: '3rem', alignItems: 'start' }}>
        
        {/* Left: Certificate representation */}
        <div>
          <div id="contract-certificate-print" className="contract-certificate-wrapper">
            <div className="contract-certificate-border">
              <div className="cert-header">
                <div className="cert-title-pre">Certificat Officiel</div>
                <h1 className="cert-title">Contrat d'Amour</h1>
                <div className="cert-number">Contrat N° : {contract.numero}</div>
                <div className="cert-divider">
                  <div className="cert-divider-line"></div>
                  <Heart className="cert-divider-heart" size={20} fill="var(--accent-rose)" />
                  <div className="cert-divider-line"></div>
                </div>
              </div>

              <div className="cert-body">
                <p>Il est solennellement convenu et convenablement établi que</p>
                <div className="cert-names">
                  {contract.prenom_createur} {contract.nom_createur}
                </div>
                <p>et</p>
                <div className="cert-names">
                  {isSigned ? `${partner.prenom} ${partner.nom}` : '______________________'}
                </div>
                <p style={{ marginTop: '1.5rem' }}>
                  S'engagent mutuellement l'un envers l'autre à compter du
                </p>
                <div className="cert-names" style={{ fontSize: '1.2rem', color: '#c9184a' }}>
                  {formatDate(contract.date_relation)}
                </div>
                <p style={{ marginTop: '1rem' }}>
                  à respecter les clauses d'engagement suivantes :
                </p>

                <div className="cert-clauses">
                  {contract.clauses}
                </div>

                <p style={{ fontSize: '0.95rem', fontStyle: 'italic', color: '#555', marginTop: '2rem' }}>
                  Fait en foi de quoi, les partenaires apposent ci-dessous leurs signatures électroniques :
                </p>
              </div>

              <div className="cert-signatures">
                <div className="cert-signature-block">
                  <div className="cert-signature-title">Signature du Partenaire Principal</div>
                  <img src={contract.signature_createur} alt="Signature Créateur" className="cert-signature-img" />
                  <div className="cert-signature-name">{contract.prenom_createur} {contract.nom_createur}</div>
                  <div className="cert-signature-date">Créé le {formatDate(contract.created_at)}</div>
                </div>

                <div className="cert-signature-block">
                  <div className="cert-signature-title">Signature du Co-signataire</div>
                  {isSigned ? (
                    <>
                      <img src={partner.signature} alt="Signature Partenaire" className="cert-signature-img" />
                      <div className="cert-signature-name">{partner.prenom} {partner.nom}</div>
                      <div className="cert-signature-date">Signé le {formatDate(partner.date_signature)}</div>
                    </>
                  ) : (
                    <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '0.9rem', fontStyle: 'italic', border: '1px dashed #ccc', borderRadius: '4px', width: '100%', marginBottom: '0.5rem' }}>
                      En attente de signature
                    </div>
                  )}
                </div>
              </div>

              {/* Red Wax Seal Overlay */}
              <div className="wax-seal">
                <div className="wax-seal-inner">
                  <div className="wax-seal-text">{sealText}</div>
                  <div className="wax-seal-sub">{isSigned ? 'VALIDÉ' : 'EN ATTENTE'}</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Panel: Metadata details if signed */}
        {isSigned && (
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-gold)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
              Détails du Partenaire
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem' }}>Nom complet</span>
                <strong>{partner.prenom} {partner.nom}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem' }}>Date de naissance</span>
                <strong>
                  <Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {formatDate(partner.date_naissance)}
                </strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem' }}>Adresse email</span>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', wordBreak: 'break-all' }}>
                  <Mail size={14} />
                  {partner.email}
                </strong>
              </div>

              {partner.telephone && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem' }}>Téléphone</span>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={14} />
                    {partner.telephone}
                  </strong>
                </div>
              )}

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem' }}>Date de signature</span>
                <strong>{formatDate(partner.date_signature)}</strong>
              </div>

              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(40,167,69,0.05)', border: '1px solid rgba(40,167,69,0.2)', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ color: '#28a745', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Statut : Contrat Validé
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ContractDetails;
