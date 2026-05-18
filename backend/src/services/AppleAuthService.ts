import axios from 'axios';
import * as jose from 'jose';
import { customError } from '../utils/errors';

interface ApplePublicKey {
  kid: string;
  kty: string;
  alg: string;
  use: string;
  n: string;
  e: string;
}

export interface AppleIdTokenPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  email?: string;
  email_verified?: string;
  is_private_email?: string;
  auth_time?: number;
  nonce?: string;
  nonce_supported?: boolean;
}

export interface AppleUserInfo {
  appleId: string;
  email: string | null;
  isPrivateEmail: boolean;
}

const APPLE_AUTH_KEYS_URL = 'https://appleid.apple.com/auth/keys';
const APPLE_ISSUER = 'https://appleid.apple.com';

export async function verifyAppleIdToken(idToken: string): Promise<AppleIdTokenPayload> {
  const APPLE_APP_ID = process.env.APPLE_APP_ID;
  
  if (!APPLE_APP_ID) {
    throw customError('CONFIG_ERROR', 'APPLE_APP_ID not configured', 500);
  }

  try {
    const JWKS = jose.createRemoteJWKSet(new URL(APPLE_AUTH_KEYS_URL));
    
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: APPLE_ISSUER,
      audience: APPLE_APP_ID,
    });

    const typedPayload = payload as AppleIdTokenPayload;

    if (!typedPayload.sub) {
      throw customError('INVALID_TOKEN', 'Missing subject (sub) in token', 400);
    }

    return typedPayload;
  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED') {
      throw customError('INVALID_TOKEN', 'Token has expired', 400);
    }
    if (error.code === 'ERR_JWT_INVALID') {
      throw customError('INVALID_TOKEN', 'Invalid token signature', 400);
    }
    if (error.code) {
      throw customError('AUTH_ERROR', error.message, 400);
    }
    throw customError('AUTH_ERROR', error.message || 'Failed to verify Apple ID token', 400);
  }
}

export async function fetchApplePublicKeys(): Promise<ApplePublicKey[]> {
  try {
    const response = await axios.get(APPLE_AUTH_KEYS_URL);
    return response.data.keys;
  } catch (error) {
    throw customError('APPLE_AUTH_ERROR', 'Failed to fetch Apple public keys', 500);
  }
}

export async function getAppleUserInfo(idToken: string): Promise<AppleUserInfo> {
  const payload = await verifyAppleIdToken(idToken);
  
  return {
    appleId: payload.sub,
    email: payload.email || null,
    isPrivateEmail: payload.is_private_email === 'true',
  };
}