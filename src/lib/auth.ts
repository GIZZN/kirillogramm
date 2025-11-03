import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthUser extends User {
  password?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; name: string; created_at?: string };
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      created_at: decoded.created_at || ''
    };
  } catch {
    return null;
  }
}

export async function createUser(email: string, password: string, name: string): Promise<User | null> {
  try {
    const hashedPassword = await hashPassword(password);
    
    const result = await query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, hashedPassword, name]
    );

    return result.rows[0] as User;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      throw new Error('Пользователь с таким email уже существует');
    }
    throw new Error('Ошибка при создании пользователя');
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const result = await query(
      'SELECT id, email, password, name, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0] as { id: number; email: string; name: string; created_at: string; password: string };
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return null;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const result = await query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [id]
    );

    return (result.rows[0] as User) || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}
