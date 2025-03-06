import { query } from '../db';

export interface Auth {
  id: number;
  user_id: number;
  verification_id: string | null;
  refresh_token: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAuthInput {
  user_id: number;
  verification_id?: string;
  refresh_token?: string;
}

/**
 * Find auth record by user ID
 */
export async function findByUserId(userId: number): Promise<Auth | null> {
  const result = await query('SELECT * FROM auth WHERE user_id = $1', [userId]);
  return result.rows.length ? result.rows[0] : null;
}

/**
 * Find auth record by verification ID
 */
export async function findByVerificationId(verificationId: string): Promise<Auth | null> {
  const result = await query('SELECT * FROM auth WHERE verification_id = $1', [verificationId]);
  return result.rows.length ? result.rows[0] : null;
}

/**
 * Find auth record by refresh token
 */
export async function findByRefreshToken(refreshToken: string): Promise<Auth | null> {
  const result = await query('SELECT * FROM auth WHERE refresh_token = $1', [refreshToken]);
  return result.rows.length ? result.rows[0] : null;
}

/**
 * Create a new auth record
 */
export async function create(authData: CreateAuthInput): Promise<Auth> {
  const { user_id, verification_id, refresh_token } = authData;
  
  const result = await query(
    'INSERT INTO auth (user_id, verification_id, refresh_token) VALUES ($1, $2, $3) RETURNING *',
    [user_id, verification_id || null, refresh_token || null]
  );
  
  return result.rows[0];
}

/**
 * Update auth record
 */
export async function update(userId: number, authData: Partial<Auth>): Promise<Auth | null> {
  const { verification_id, refresh_token } = authData;
  
  const result = await query(
    `UPDATE auth SET 
      verification_id = COALESCE($1, verification_id),
      refresh_token = COALESCE($2, refresh_token),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $3 RETURNING *`,
    [verification_id, refresh_token, userId]
  );
  
  return result.rows.length ? result.rows[0] : null;
}

/**
 * Update or create auth record
 */
export async function upsert(authData: CreateAuthInput): Promise<Auth> {
  const { user_id, verification_id, refresh_token } = authData;
  
  // Check if auth record exists
  const existingAuth = await findByUserId(user_id);
  
  if (existingAuth) {
    // Update existing record
    const updatedAuth = await update(user_id, { verification_id, refresh_token });
    return updatedAuth!;
  } else {
    // Create new record
    return create(authData);
  }
}

/**
 * Delete auth record by user ID
 */
export async function remove(userId: number): Promise<boolean> {
  const result = await query('DELETE FROM auth WHERE user_id = $1', [userId]);
  return result.rowCount > 0;
} 