import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie, clearSessionCookie } from '@/lib/session';
import { createMockSessionForRole } from '@/lib/mock-auth';
import type { UserRole } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const { role } = await request.json() as { role?: UserRole | 'LOGOUT' };

    if (!role || role === 'LOGOUT') {
      await clearSessionCookie();
      return NextResponse.json({ success: true, data: { user: null } });
    }

    if (!['SELLER', 'DEALER_ADMIN', 'DEALER_AGENT', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ROLE', message: 'Unknown role' } },
        { status: 400 }
      );
    }

    const session = createMockSessionForRole(role as UserRole);
    await setSessionCookie(session, true);

    return NextResponse.json({
      success: true,
      data: { user: session.user },
    });
  } catch (error) {
    console.error('Dev switch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to switch role' } },
      { status: 500 }
    );
  }
}
