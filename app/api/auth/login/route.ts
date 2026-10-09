import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/session';
import { SEED_USERS } from '@/lib/mock-auth';
import type { LoginCredentials, Session, User } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    const BACKEND_URL = process.env.BACKEND_API_URL;

    // When backend API is configured, forward request to external Express backend
    if (BACKEND_URL) {
      try {
        const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await backendRes.json();
        if (!backendRes.ok) {
          return NextResponse.json(
            { success: false, error: data.error || { code: 'AUTH_FAILED', message: 'Authentication failed' } },
            { status: backendRes.status }
          );
        }

        const session: Session = {
          user: data.user,
          token: data.token,
          expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };

        await setSessionCookie(session, rememberMe);
        return NextResponse.json({ success: true, data: { user: session.user } });
      } catch (err) {
        console.warn('Backend API unavailable, falling back to local simulation:', err);
      }
    }

    // Local / Dev Fallback simulation
    const normalizedEmail = email.toLowerCase().trim();
    let user: User;

    if (normalizedEmail.includes('dealer')) {
      user = SEED_USERS.DEALER_ADMIN;
    } else if (normalizedEmail.includes('agent')) {
      user = SEED_USERS.DEALER_AGENT;
    } else if (normalizedEmail.includes('admin')) {
      user = SEED_USERS.ADMIN;
    } else {
      user = {
        ...SEED_USERS.SELLER,
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      };
    }

    const session: Session = {
      user,
      token: `jwt_sim_${user.role.toLowerCase()}_${Date.now()}`,
      expiresAt: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000).toISOString(),
    };

    await setSessionCookie(session, rememberMe);

    return NextResponse.json({
      success: true,
      data: { user: session.user },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Internal server error during login' } },
      { status: 500 }
    );
  }
}
