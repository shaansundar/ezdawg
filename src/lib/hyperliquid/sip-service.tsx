/**
 * SIP service - Frontend API for SIP operations
 * Handles signature creation and API communication
 */

import { Address } from 'viem';

export interface CreateSIPParams {
  assetName: string;
  assetIndex: number;
  monthlyAmountUsdc: number;
  signMessage: (message: string) => Promise<string>;
}

export interface SIPResult {
  success: boolean;
  sip?: any;
  message?: string;
  error?: string;
}

/**
 * Create a message for signing
 */
function createSignatureMessage(
  action: string,
  params: Record<string, any>
): string {
  const nonce = Date.now();
  const paramsStr = Object.entries(params)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  return `${action}\n${paramsStr}\nNonce: ${nonce}`;
}

/**
 * Create a new SIP with signature verification
 */
export async function createSIP(
  params: CreateSIPParams
): Promise<SIPResult> {
  try {
    // Create message to sign
    const message = createSignatureMessage('Create SIP', {
      asset: params.assetName,
      monthlyAmount: `${params.monthlyAmountUsdc} USDC`,
    });

    // Get signature from user's wallet
    const signature = await params.signMessage(message);

    // Send to backend
    const response = await fetch('/api/sip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetName: params.assetName,
        assetIndex: params.assetIndex,
        monthlyAmountUsdc: params.monthlyAmountUsdc,
        message,
        signature,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to create SIP',
      };
    }

    return result;
  } catch (error: any) {
    console.error('Create SIP error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create SIP',
    };
  }
}

/**
 * Get user's SIPs (no signature required for read operations)
 */
export async function getUserSIPs(walletAddress: Address): Promise<any[]> {
  try {
    const response = await fetch(`/api/sip?walletAddress=${walletAddress}`);
    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to fetch SIPs:', result.error);
      return [];
    }

    return result.sips || [];
  } catch (error) {
    console.error('Get SIPs error:', error);
    return [];
  }
}

/**
 * Update SIP status with signature verification
 */
export async function updateSIPStatus(
  sipId: string,
  status: 'active' | 'paused' | 'cancelled',
  signMessage: (message: string) => Promise<string>
): Promise<SIPResult> {
  try {
    // Create message to sign
    const message = createSignatureMessage('Update SIP', {
      sipId,
      status,
    });

    // Get signature from user's wallet
    const signature = await signMessage(message);

    // Send to backend
    const response = await fetch('/api/sip', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sipId,
        status,
        message,
        signature,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to update SIP',
      };
    }

    return result;
  } catch (error: any) {
    console.error('Update SIP error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update SIP',
    };
  }
}
