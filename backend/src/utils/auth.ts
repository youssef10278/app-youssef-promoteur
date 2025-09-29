import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-here';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

// Hachage du mot de passe
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
};

// Vérification du mot de passe
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Génération du token JWT
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN as any });
};

// Génération du refresh token
export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET as string, { expiresIn: JWT_REFRESH_EXPIRES_IN as any });
};

// Vérification du token JWT
export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

// Vérification du refresh token
export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
};

// Décodage du token sans vérification (pour debug)
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};
