import { jwtVerify, SignJWT } from 'jose';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'sua_chave_secreta_jwt_muito_segura_2024');
const EXPIRATION_TIME = '4h'; // 4 horas

export interface UserJwtPayload {
  id: string;
  nome: string;
  email: string;
  username: string;
  role: string;
  prestadorId: string;
  iat: number;
  exp: number;
}

function isUserJwtPayload(p: unknown): p is UserJwtPayload {
  if (!p || typeof p !== 'object') return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.nome === 'string' &&
    typeof o.email === 'string' &&
    typeof o.username === 'string' &&
    typeof o.role === 'string' &&
    typeof o.prestadorId === 'string' &&
    typeof o.iat === 'number' &&
    typeof o.exp === 'number'
  );
}

export async function signJwt(payload: Omit<UserJwtPayload, 'iat' | 'exp'>) {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(EXPIRATION_TIME)
      .sign(JWT_SECRET);
    
    return token;
  } catch (error: unknown) {
    console.error('Erro ao assinar JWT:', error);
    throw new Error('Falha ao gerar token de autenticação');
  }
}

export async function verifyJwt(token: string): Promise<UserJwtPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!isUserJwtPayload(payload as unknown)) {
      throw new Error('Estrutura do token inválida');
    }
    return payload as unknown as UserJwtPayload;
  } catch (error: unknown) {
    console.error('Erro ao verificar JWT:', error);
    throw new Error('Token inválido ou expirado');
  }
}

export async function getTokenData(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;
    
    const payload = await verifyJwt(token);
    return payload;
  } catch (error: unknown) {
    console.error('Erro ao obter dados do token:', error);
    return null;
  }
}

export function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  return !!token;
}

export function isAdmin(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role === 'Administrador' || payload.role === 'Master';
  } catch {
    return false;
  }
}

export function isMaster(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role === 'Master';
  } catch {
    return false;
  }
}
