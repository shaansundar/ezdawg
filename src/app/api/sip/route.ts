import { NextRequest, NextResponse } from 'next/server';
import * as sipService from '@/backend/services/sip.service';
import { verifySignature } from '@/backend/lib/signature-verify';

/**
 * POST /api/sip - Create new SIP with signature verification
 */
export async function POST(request: NextRequest) {
  try {
    const { assetName, assetIndex, monthlyAmountUsdc, message, signature } =
      await request.json();

    // Validate required fields
    if (!assetName || assetIndex === undefined || !monthlyAmountUsdc || !message || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify signature and recover signer's address
    const verifyResult = await verifySignature(message, signature);

    if (!verifyResult.valid) {
      return NextResponse.json(
        { error: verifyResult.error || 'Invalid signature' },
        { status: 401 }
      );
    }

    // The recovered address IS the authenticated user
    const walletAddress = verifyResult.address!;

    // Create SIP for the authenticated user
    const result = await sipService.createSIP({
      walletAddress,
      assetName,
      assetIndex,
      monthlyAmountUsdc,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('SIP creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sip?walletAddress=0x... - Get user's SIPs
 * Note: This endpoint doesn't require signature since it's read-only
 * For write operations, always use signature verification
 */
export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.nextUrl.searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    const sips = await sipService.getUserSIPs(walletAddress);

    return NextResponse.json({ sips });
  } catch (error: any) {
    console.error('Get SIPs error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sip - Update SIP status with signature verification
 */
export async function PATCH(request: NextRequest) {
  try {
    const { sipId, status, message, signature } = await request.json();

    if (!sipId || !status || !message || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify signature
    const verifyResult = await verifySignature(message, signature);

    if (!verifyResult.valid) {
      return NextResponse.json(
        { error: verifyResult.error || 'Invalid signature' },
        { status: 401 }
      );
    }

    // Update SIP status
    const result = await sipService.updateSIPStatus(sipId, status);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Update SIP error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
