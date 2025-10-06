const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
const connect = async () => {
  try {
    const client = await pool.connect();
    console.log('📊 Connected to PostgreSQL database');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err);
    throw err;
  }
};

// Execute query helper
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('🔍 Query executed:', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('❌ Query error:', err);
    throw err;
  }
};

// Get client for transactions
const getClient = async () => {
  return await pool.connect();
};

module.exports = {
  pool,
  connect,
  query,
  getClient
};