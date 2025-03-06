import { Pool } from 'pg';
import env from '../config/env';
import { createTables } from './schema';

// Create a PostgreSQL connection pool
const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a new connection
});

// Test the database connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('❌ Error connecting to PostgreSQL database:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    
    // Initialize database schema if needed
    if (env.nodeEnv === 'development') {
      initializeDatabase().catch(console.error);
    }
  }
});

// Function to initialize the database schema
async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');
    await createTables(pool);
    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database schema:', error);
    throw error;
  }
}

// Export query function for use in other modules
export const query = async (text: string, params: any[] = []) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (env.nodeEnv === 'development') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

// Export the pool for transaction support
export default pool; 