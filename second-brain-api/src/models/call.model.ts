import { query } from '../db';

export interface Call {
  id: number;
  user_id: number;
  twilio_call_sid: string | null;
  duration: number | null;
  call_status: string;
  call_type: string;
  started_at: Date | null;
  ended_at: Date | null;
  created_at: Date;
}

export interface CreateCallInput {
  user_id: number;
  twilio_call_sid?: string;
  duration?: number;
  call_status: string;
  call_type: string;
  started_at?: Date;
  ended_at?: Date;
}

/**
 * Find call by ID
 */
export async function findById(id: number): Promise<Call | null> {
  const result = await query('SELECT * FROM calls WHERE id = $1', [id]);
  return result.rows.length ? result.rows[0] : null;
}

/**
 * Find calls by user ID
 */
export async function findByUserId(userId: number): Promise<Call[]> {
  const result = await query('SELECT * FROM calls WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return result.rows;
}

/**
 * Find call by Twilio call SID
 */
export async function findByCallSid(callSid: string): Promise<Call | null> {
  const result = await query('SELECT * FROM calls WHERE twilio_call_sid = $1', [callSid]);
  return result.rows.length ? result.rows[0] : null;
}

/**
 * Create a new call record
 */
export async function create(callData: CreateCallInput): Promise<Call> {
  const { 
    user_id, 
    twilio_call_sid, 
    duration, 
    call_status, 
    call_type, 
    started_at, 
    ended_at 
  } = callData;
  
  const result = await query(
    `INSERT INTO calls (
      user_id, twilio_call_sid, duration, call_status, call_type, started_at, ended_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [user_id, twilio_call_sid || null, duration || null, call_status, call_type, started_at || null, ended_at || null]
  );
  
  return result.rows[0];
}

/**
 * Update call record
 */
export async function update(id: number, callData: Partial<Call>): Promise<Call | null> {
  const { 
    twilio_call_sid, 
    duration, 
    call_status, 
    call_type, 
    started_at, 
    ended_at 
  } = callData;
  
  const result = await query(
    `UPDATE calls SET 
      twilio_call_sid = COALESCE($1, twilio_call_sid),
      duration = COALESCE($2, duration),
      call_status = COALESCE($3, call_status),
      call_type = COALESCE($4, call_type),
      started_at = COALESCE($5, started_at),
      ended_at = COALESCE($6, ended_at)
    WHERE id = $7 RETURNING *`,
    [twilio_call_sid, duration, call_status, call_type, started_at, ended_at, id]
  );
  
  return result.rows.length ? result.rows[0] : null;
} 