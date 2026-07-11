const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const ensureContractColumns = async () => {
  try {
    await pool.query("ALTER TABLE contracts ADD COLUMN IF NOT EXISTS decision VARCHAR(20) DEFAULT 'pending'");
    await pool.query("ALTER TABLE contracts ADD COLUMN IF NOT EXISTS response_message TEXT");
    await pool.query("ALTER TABLE contracts ADD COLUMN IF NOT EXISTS response_at TIMESTAMP WITH TIME ZONE");
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'contracts_decision_check'
        ) THEN
          ALTER TABLE contracts
          ADD CONSTRAINT contracts_decision_check CHECK (decision IN ('pending', 'accepted', 'declined'));
        END IF;
      END $$;
    `);
  } catch (error) {
    console.error('Error ensuring contract columns:', error.message);
  }
};

ensureContractColumns();

// Helper to generate the next contract number (e.g. LC-20260710-0001)
const generateContractNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  try {
    const countRes = await pool.query(
      "SELECT COUNT(*) FROM contracts WHERE TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYYMMDD') = $1",
      [dateStr]
    );
    const count = parseInt(countRes.rows[0].count, 10) + 1;
    const seqStr = String(count).padStart(4, '0');
    return `LC-${dateStr}-${seqStr}`;
  } catch (error) {
    console.error('Error generating contract number:', error);
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
        telephone_createur, date_relation, clauses, signature_createur, statut, decision
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'En attente', 'pending')
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
    const publicContract = {
      ...contract,
      decision: contract.statut === 'Signe' ? 'accepted' : 'pending'
    };

    let partnerInfo = null;
    if (publicContract.decision === 'accepted') {
      const partnerRes = await pool.query(
        'SELECT nom, prenom, date_naissance, email, telephone, date_signature FROM partner_signatures WHERE contract_id = $1',
        [publicContract.id]
      );
      if (partnerRes.rows.length > 0) {
        partnerInfo = partnerRes.rows[0];
      }
    }

    res.json({ contract: publicContract, partner: partnerInfo });
  } catch (error) {
    console.error('Erreur récupération contrat public:', error);
    res.status(500).json({ message: 'Une erreur serveur est survenue.' });
  }
});

// 4. POST /api/contracts/token/:token/decision - Accept or decline contract by partner (Public)
router.post('/token/:token/decision', async (req, res) => {
  const { token } = req.params;
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const decision = body.decision;
  const nom = body.nom;
  const prenom = body.prenom;
  const date_naissance = body.date_naissance;
  const email = body.email;
  const telephone = body.telephone;
  const signature = body.signature;
  const message = body.message;

  if (!decision || !['accepted', 'declined'].includes(decision)) {
    return res.status(400).json({ message: 'Décision invalide.' });
  }

  const isAccepted = decision === 'accepted';

  if (!nom || !prenom || !date_naissance || !email) {
    return res.status(400).json({ message: 'Veuillez remplir vos informations de base avant de poursuivre.' });
  }

  if (isAccepted && !signature) {
    return res.status(400).json({ message: 'Veuillez dessiner votre signature pour accepter le contrat.' });
  }

  try {
    const contractRes = await pool.query('SELECT id, statut FROM contracts WHERE token = $1', [token]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ message: 'Contrat introuvable.' });
    }

    const contract = contractRes.rows[0];
    const nextStatus = decision === 'accepted' ? 'Signe' : 'En attente';

    await pool.query('UPDATE contracts SET statut = $1 WHERE id = $2', [nextStatus, contract.id]);

    res.json({
      message: isAccepted ? 'Contrat accepté avec succès.' : 'Contrat refusé avec succès.',
      decision
    });
  } catch (error) {
    console.error('Erreur décision contrat:', error);
    res.status(500).json({ message: 'Une erreur serveur est survenue lors de la décision sur le contrat.' });
  }
});

// 5. PUT /api/contracts/:id - Update a contract (Authenticated)
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const {
    nom_createur,
    prenom_createur,
    email_createur,
    telephone_createur,
    date_relation,
    clauses,
    signature_createur
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE contracts
       SET nom_createur = COALESCE($1, nom_createur),
           prenom_createur = COALESCE($2, prenom_createur),
           email_createur = COALESCE($3, email_createur),
           telephone_createur = COALESCE($4, telephone_createur),
           date_relation = COALESCE($5, date_relation),
           clauses = COALESCE($6, clauses),
           signature_createur = COALESCE($7, signature_createur)
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        nom_createur || null,
        prenom_createur || null,
        email_createur || null,
        telephone_createur || null,
        date_relation || null,
        clauses || null,
        signature_createur || null,
        id,
        req.user.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Contrat introuvable ou accès non autorisé.' });
    }

    res.json({ message: 'Contrat mis à jour avec succès.', contract: result.rows[0] });
  } catch (error) {
    console.error('Erreur mise à jour contrat:', error);
    res.status(500).json({ message: 'Une erreur serveur est survenue pendant la mise à jour.' });
  }
});

// 6. DELETE /api/contracts/:id - Delete a contract (Authenticated)
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM contracts WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Contrat introuvable ou accès non autorisé.' });
    }

    res.json({ message: 'Contrat supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur suppression contrat:', error);
    res.status(500).json({ message: 'Une erreur serveur est survenue pendant la suppression.' });
  }
});

// 7. GET /api/contracts/:id - Get full contract details (Authenticated - dashboard details page)
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
