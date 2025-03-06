import { Pool } from 'pg';

/**
 * Create database tables if they don't exist
 */
export async function createTables(pool: Pool): Promise<void> {
  // Create database schema in a transaction
  const client = await pool.connect();

  try {
    // Begin transaction
    await client.query('BEGIN');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create auth table to store verification tokens, etc.
    await client.query(`
      CREATE TABLE IF NOT EXISTS auth (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        verification_id VARCHAR(100),
        refresh_token VARCHAR(500),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        source VARCHAR(20) NOT NULL,
        message_type VARCHAR(20) NOT NULL,
        direction VARCHAR(10) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create calls table
    await client.query(`
      CREATE TABLE IF NOT EXISTS calls (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        twilio_call_sid VARCHAR(100),
        duration INTEGER,
        call_status VARCHAR(20) NOT NULL,
        call_type VARCHAR(20) NOT NULL,
        started_at TIMESTAMPTZ,
        ended_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create reminders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        scheduled_time TIMESTAMPTZ NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        recurrence_pattern VARCHAR(100),
        ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
        priority INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indices for performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_reminders_user_id_status ON reminders(user_id, status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_time ON reminders(scheduled_time)');

    // Commit transaction
    await client.query('COMMIT');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Release client back to the pool
    client.release();
  }
}

/**
 * Drop all tables - useful for testing
 */
export async function dropTables(pool: Pool): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // Drop tables in correct order (respect foreign key constraints)
    await client.query('DROP TABLE IF EXISTS reminders');
    await client.query('DROP TABLE IF EXISTS calls');
    await client.query('DROP TABLE IF EXISTS messages');
    await client.query('DROP TABLE IF EXISTS auth');
    await client.query('DROP TABLE IF EXISTS users');
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
} 