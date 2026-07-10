const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Helper to generate the next contract number (e.g. LC-20260710-0001)
const generateContractNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  try {
    // Count contracts created today to get the sequence number
    const countRes = await pool.query(
      "SELECT COUNT(*) FROM contracts WHERE TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYYMMDD') = $1",
      [dateStr]
    );
    const count = parseInt(countRes.rows[0].count, 10) + 1;
    const seqStr = String(count).padStart(4, '0');
    return `LC-${dateStr}-${seqStr}`;
  } catch (error) {
    console.error('Error generating contract number:', error);
    // Fallback: use a random suffix if counting fails
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `LC-${dateStr}-${randomSuffix}`;
  }
};

// 1. POST /api/contracts - Create a contract (Authenticated)
router.post('/', authMiddleware, async (req, res) => {
  const {
    nom_createur,
    prenom_createur,
    email_createur,
    telephone_createur,
    date_relation,
    clauses,
    signature_createur
  } = req.body;

  if (!nom_createur || !prenom_createur || !email_createur || !date_relation || !clauses || !signature_createur) {
    return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires et signer le contrat.' });
  }

  try {
    const numero = await generateContractNumber();
    const token = crypto.randomBytes(16).toString('hex');

    const result = await pool.query(
      `INSERT INTO contracts (
        user_id, numero, token, nom_createur, prenom_createur, email_createur,
        telephone_createur, date_relation, clauses, signature_createur, statut
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'En attente')
      RETURNING *`,
      [
        req.user.id,
        numero,
        token,
        nom_createur,
        prenom_createur,
        email_createur,
        telephone_createur || null,
        date_relation,
        clauses,
        signature_createur
      ]
    );

    res.status(201).json({
      message: 'Contrat créé avec succès.',
      contract: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur création contrat:', error);
    res.status(500).json({ message: 'Une erreur serveur est survenue lors de la création du contrat.' });
  }
});

// 2. GET /api/contracts - List contracts for logged-in user (Authenticated)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, p.nom AS nom_partenaire, p.prenom AS prenom_partenaire, p.date_signature
       FROM contracts c
       LEFT JOIN partner_signatures p ON c.id = p.contract_id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération contrats:', error);
    res.status(500).json({ message: 'Une erreur serveur est survenue.' });
  }
});

// 3. GET /api/contracts/token/:token - Get contract details by token (Public - for partner signing page)
router.get('/token/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, numero, nom_createur, prenom_createur, date_relation, clauses, signature_createur, statut, created_at FROM contracts WHERE token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Contrat introuvable.' });
    }

    const contract = result.rows[0];

    // If already signed, fetch partner signature details as well
    let partnerInfo = null;
    if (contract.statut === 'Signe') {
      const partnerRes = await pool.query(
        'SELECT nom, prenom, date_naissance, email, telephone, date_signature FROM partner_signatures WHERE contract_id = $1',
        [contract.id]
      );
      if (partnerRes.rows.length > 0) {
        partnerInfo = partnerRes.rows[0];
      }
    }

    res.json({ contract, partner: partnerInfo });
  } catch (error) {
    console.error('Erreur récupération contrat public:', error);
    res.status(500).json({ message: 'Une erreur serveur est survenue.' });
  }
});

// 4. POST /api/contracts/token/:token/sign - Sign contract by partner (Public)
router.post('/token/:token/sign', async (req, res) => {
  const { token } = req.params;
  const { nom, prenom, date_naissance, email, telephone, signature } = req.body;

  if (!nom || !prenom || !date_naissance || !email || !signature) {
    return res.status(400).json({ message: 'Veuillez remplir tous les champs requis et dessiner votre signature.' });
  }

  try {
    // 1. Find contract
    const contractRes = await pool.query('SELECT id, statut FROM contracts WHERE token = $1', [token]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ message: 'Contrat introuvable.' });
    }

    const contract = contractRes.rows[0];
    if (contract.statut === 'Signe') {
      return res.status(400).json({ message: 'Ce contrat a déjà été signé.' });
    }

    // Begin Transaction
    await pool.query('BEGIN');

    // 2. Insert partner signature
    await pool.query(
      `INSERT INTO partner_signatures (
        contract_id, nom, prenom, date_naissance, email, telephone, signature
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        contract.id,
        nom,
        prenom,
        date_naissance,
        email,
        telephone || null,
        signature
      ]
    );

    // 3. Update contract status
    await pool.query(
      "UPDATE contracts SET statut = 'Signe' WHERE id = $1",
      [contract.id]
    );

    await pool.query('COMMIT');

    res.json({ message: 'Contrat signé avec succès !' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erreur signature contrat:', error);
    res.status(500).json({ message: 'Une erreur serveur est survenue lors de la signature.' });
  }
});

// 5. GET /api/contracts/:id - Get full contract details (Authenticated - dashboard details page)
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const contractRes = await pool.query(
      'SELECT * FROM contracts WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (contractRes.rows.length === 0) {
      return res.status(404).json({ message: 'Contrat introuvable ou accès non autorisé.' });
    }

    const contract = contractRes.rows[0];

    // Fetch partner signature details
    const partnerRes = await pool.query(
      'SELECT * FROM partner_signatures WHERE contract_id = $1',
      [contract.id]
    );

    res.json({
      contract,
      partner: partnerRes.rows[0] || null
    });
  } catch (error) {
    console.error('Erreur récupération contrat complet:', error);
    res.status(500).json({ message: 'Une erreur serveur est survenue.' });
  }
});

module.exports = router;
