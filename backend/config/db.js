const { Pool } = require('pg');
require('dotenv').config();

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pgPool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

function getDB() {
  return pgPool;
}

async function connectMongo() {
  console.log('MongoDB skipped - using PostgreSQL JSONB instead');
}

module.exports = { pgPool, connectMongo, getDB };