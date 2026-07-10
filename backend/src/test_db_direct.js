const { Pool } = require('pg');

console.log('Tentative de connexion en direct à la base de données Supabase (sans parsing URI)...');

const pool = new Pool({
  host: 'aws-1-us-west-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.uhffjyjufknlhwlyuzbr',
  password: '6h-&X?_K&uw@fzQ',
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erreur de connexion directe détectée :');
    console.error(err);
  } else {
    console.log('✅ Connexion réussie ! Date/Heure de la base de données :', res.rows[0].now);
  }
  pool.end();
});
