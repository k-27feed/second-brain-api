import { query } from '../db';

export interface User {
  id: number;
  phone_number: string;
  name: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  phone_number: string;
  name?: string;
}

/**
 * Find user by ID
 */
export async function findById(id: number): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows.length ? result.rows[0] : null;
}

/**
 * Find user by phone number
 */
export async function findByPhoneNumber(phoneNumber: string): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE phone_number = $1', [phoneNumber]);
  return result.rows.length ? result.rows[0] : null;
}

/**
 * Create a new user
 */
export async function create(userData: CreateUserInput): Promise<User> {
  const { phone_number, name } = userData;
  
  const result = await query(
    'INSERT INTO users (phone_number, name) VALUES ($1, $2) RETURNING *',
    [phone_number, name || null]
  );
  
  return result.rows[0];
}

/**
 * Update user information
 */
export async function update(id: number, userData: Partial<User>): Promise<User | null> {
  // Extract fields that can be updated
  const { name } = userData;
  
  const result = await query(
    'UPDATE users SET name = COALESCE($1, name), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [name, id]
  );
  
  return result.rows.length ? result.rows[0] : null;
}

/**
 * Delete a user
 */
export async function remove(id: number): Promise<boolean> {
  const result = await query('DELETE FROM users WHERE id = $1', [id]);
  return result.rowCount > 0;
} 