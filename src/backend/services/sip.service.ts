import * as db from './db.service';

/**
 * SIP service - handles SIP business logic
 * Orchestrates between database operations
 */

export interface SIPResult {
  success: boolean;
  sip?: db.SIP;
  message?: string;
  error?: string;
}

export interface CreateSIPParams {
  walletAddress: string;
  assetName: string;
  assetIndex: number;
  monthlyAmountUsdc: number;
}

/**
 * Create a new SIP for a user
 * User must already exist (created during agent setup)
 */
export async function createSIP(params: CreateSIPParams): Promise<SIPResult> {
  const { walletAddress, assetName, assetIndex, monthlyAmountUsdc } = params;

  // Validate monthly amount
  if (monthlyAmountUsdc < 1000) {
    return {
      success: false,
      error: 'Monthly investment must be at least 1000 USDC',
    };
  }

  // Get user by wallet address
  const user = await db.getUserByWallet(walletAddress);
  if (!user) {
    return {
      success: false,
      error: 'User not found',
    };
  }

  // Create SIP
  const sip = await db.createSIP(
    user.id,
    assetName,
    assetIndex,
    monthlyAmountUsdc
  );

  if (!sip) {
    return {
      success: false,
      error: 'Failed to create SIP',
    };
  }

  return {
    success: true,
    sip,
    message: 'SIP created successfully',
  };
}

/**
 * Get all SIPs for a user
 */
export async function getUserSIPs(walletAddress: string): Promise<db.SIP[]> {
  const user = await db.getUserByWallet(walletAddress);
  if (!user) {
    return [];
  }

  return await db.getUserSIPs(user.id);
}

/**
 * Get active SIPs for a user
 */
export async function getActiveSIPs(walletAddress: string): Promise<db.SIP[]> {
  const user = await db.getUserByWallet(walletAddress);
  if (!user) {
    return [];
  }

  return await db.getActiveSIPs(user.id);
}

/**
 * Update SIP status (pause, resume, cancel)
 */
export async function updateSIPStatus(
  sipId: string,
  status: 'active' | 'paused' | 'cancelled'
): Promise<SIPResult> {
  const success = await db.updateSIPStatus(sipId, status);

  if (!success) {
    return {
      success: false,
      error: 'Failed to update SIP status',
    };
  }

  return {
    success: true,
    message: `SIP ${status === 'active' ? 'resumed' : status}`,
  };
}
