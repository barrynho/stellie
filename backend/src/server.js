const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db');
const authRoutes = require('./routes/auth');
const contractRoutes = require('./routes/contracts');

const app = express();
const PORT = process.env.PORT || 5000;

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
    console.error('Unable to ensure contract decision columns:', error.message);
  }
};

ensureContractColumns();

// Enable CORS
app.use(cors({
  origin: '*', // We allow all origins to simplify setup, Vercel frontend can call it
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing (support large payload for base64 canvas signature images)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path.includes('/decision')) {
    console.log('decision body', req.body);
  }
  next();
});

// Request logger simple middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);

// Health check and root route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Love Contract API Node.js server is running.',
    version: '1.0.0'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Une erreur interne est survenue sur le serveur.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
