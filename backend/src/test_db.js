const pool = require('./config/db');

console.log('Tentative de connexion à la base de données Supabase...');
console.log('URI utilisée :', process.env.DATABASE_URL ? 'Présente' : 'Absente');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erreur de connexion détectée :');
    console.error(err);
  } else {
    console.log('✅ Connexion réussie ! Date/Heure de la base de données :', res.rows[0].now);
  }
  pool.end();
});
