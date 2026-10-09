import { NextRequest, NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/session';
import type { Session, User, RegisterSellerPayload, RegisterDealerPayload } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const role = payload.role as 'SELLER' | 'DEALER';

    const BACKEND_URL = process.env.BACKEND_API_URL;
    if (BACKEND_URL) {
      try {
        const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await backendRes.json();
        if (!backendRes.ok) {
          return NextResponse.json(
            { success: false, error: data.error || { code: 'REGISTRATION_FAILED', message: 'Registration failed' } },
            { status: backendRes.status }
          );
        }

        const session: Session = {
          user: data.user,
          token: data.token,
          expiresAt: data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };

        await setSessionCookie(session, true);
        return NextResponse.json({ success: true, data: { user: session.user } });
      } catch (err) {
        console.warn('Backend API registration unavailable, falling back to local simulation:', err);
      }
    }

    // Local Simulation
    let newUser: User;

    if (role === 'DEALER') {
      const dealerData = payload as RegisterDealerPayload;
      newUser = {
        id: `usr_dealer_${Date.now()}`,
        email: dealerData.email,
        name: dealerData.contactName,
        phone: dealerData.phone,
        postalCode: dealerData.postalCode,
        province: dealerData.province,
        role: 'DEALER_ADMIN',
        kycStatus: 'VERIFIED',
        dealershipId: `dlr_${Date.now()}`,
        dealershipName: dealerData.operatingName || dealerData.legalBusinessName,
        dealerLicenseNumber: `${dealerData.licensingBody} #${dealerData.licenseNumber}`,
        createdAt: new Date().toISOString(),
      };
    } else {
      const sellerData = payload as RegisterSellerPayload;
      newUser = {
        id: `usr_seller_${Date.now()}`,
        email: sellerData.email,
        name: sellerData.name,
        phone: sellerData.phone,
        postalCode: sellerData.postalCode,
        province: sellerData.province,
        role: 'SELLER',
        kycStatus: 'PENDING', // Sellers start with PENDING KYC
        createdAt: new Date().toISOString(),
      };
    }

    const session: Session = {
      user: newUser,
      token: `jwt_sim_reg_${newUser.role.toLowerCase()}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    await setSessionCookie(session, true);

    return NextResponse.json({
      success: true,
      data: { user: session.user },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to process registration' } },
      { status: 500 }
    );
  }
}
