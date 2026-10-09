import { cookies } from 'next/headers';
import type { Session, User } from '@/types/auth';

export const SESSION_COOKIE_NAME = 'autonexa_session';

const SESSION_SECRET = process.env.SESSION_SECRET || 'autonexa-dev-super-secure-session-secret-key-32chars';

/**
 * Encodes a session object into a base64url signed string
 */
export async function encryptSession(session: Session): Promise<string> {
  const jsonStr = JSON.stringify(session);
  const base64Data = Buffer.from(jsonStr).toString('base64url');
  
  // Simple HMAC signature using Web Crypto for Edge compatibility
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(base64Data));
  const signatureBase64 = Buffer.from(signatureBuffer).toString('base64url');
  
  return `${base64Data}.${signatureBase64}`;
}

/**
 * Decodes and verifies a session string
 */
export async function decryptSession(sessionToken?: string | null): Promise<Session | null> {
  if (!sessionToken || !sessionToken.includes('.')) return null;

  try {
    const [base64Data, signatureBase64] = sessionToken.split('.');
    if (!base64Data || !signatureBase64) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBuffer = Buffer.from(signatureBase64, 'base64url');
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      encoder.encode(base64Data)
    );

    if (!isValid) return null;

    const jsonStr = Buffer.from(base64Data, 'base64url').toString('utf-8');
    const session: Session = JSON.parse(jsonStr);

    // Verify expiration
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Creates and sets the session cookie (Next.js 15 async cookies())
 */
export async function setSessionCookie(session: Session, rememberMe: boolean = true) {
  const token = await encryptSession(session);
  const cookieStore = await cookies();
  
  const expiresAt = rememberMe 
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    : new Date(Date.now() + 24 * 60 * 60 * 1000);     // 24 hours

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Reads and validates the current session from cookies
 */
export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return decryptSession(token);
}

/**
 * Deletes the session cookie (Logout)
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
