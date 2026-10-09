import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getServerSession();
    return NextResponse.json({
      success: true,
      data: {
        authenticated: !!session,
        user: session?.user || null,
      },
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SESSION_ERROR', message: 'Failed to read session' } },
      { status: 500 }
    );
  }
}
