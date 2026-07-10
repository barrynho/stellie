const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

let poolConfig = {};

if (connectionString) {
  try {
    // Use the native Node.js URL parser to automatically decode URL-encoded credentials
    const parsedUrl = new URL(connectionString);
    poolConfig = {
      host: parsedUrl.hostname,
      port: parsedUrl.port || 5432,
      database: parsedUrl.pathname.split('/')[1] || 'postgres',
      user: decodeURIComponent(parsedUrl.username),
      password: decodeURIComponent(parsedUrl.password)
    };
  } catch (urlError) {
    console.error('Failed to parse DATABASE_URL as URL, falling back to raw string:', urlError.message);
    poolConfig = { connectionString };
  }
}

const pool = new Pool({
  ...poolConfig,
  ssl: connectionString && (connectionString.includes('localhost') || connectionString.includes('127.0.0.1'))
    ? false
    : { rejectUnauthorized: false }
});

module.exports = pool;
