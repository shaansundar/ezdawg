import { recoverMessageAddress, verifyMessage } from "viem";
import { Address } from "viem";

/**
 * Signature verification utilities
 * Recovers the signer's address from a signed message with nonce validation
 */

const SIGNATURE_EXPIRY_MS = 60000; // 1 minute

export interface VerifySignatureResult {
  valid: boolean;
  address?: Address;
  error?: string;
}

/**
 * Verify a signed message and recover the signer's address
 * The recovered address IS the authenticated user
 *
 * @param message - The original message that was signed
 * @param signature - The signature from the wallet
 * @returns Object with valid flag, recovered address (if valid), and error message (if invalid)
 */
export async function verifySignature(
  message: string,
  signature: string
): Promise<VerifySignatureResult> {
  try {
    // 1. Extract and validate nonce (timestamp) first
    const nonceMatch = message.match(/Nonce:\s*(\d+)/);
    if (!nonceMatch) {
      return {
        valid: false,
        error: "Message missing nonce",
      };
    }

    const nonce = parseInt(nonceMatch[1], 10);
    const now = Date.now();
    const age = now - nonce;

    // 2. Check if signature is expired
    if (age > SIGNATURE_EXPIRY_MS) {
      return {
        valid: false,
        error: "Signature expired",
      };
    }

    // 3. Check if nonce is from the future (clock skew protection)
    if (age < -5000) {
      // Allow 5 seconds clock skew
      return {
        valid: false,
        error: "Invalid nonce timestamp",
      };
    }

    // 4. Recover the signer's address from the signature
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    });

    return {
      valid: true,
      address: recoveredAddress as Address,
    };
  } catch (error) {
    console.error("Signature verification error:", error);
    return {
      valid: false,
      error: "Signature verification failed",
    };
  }
}

/**
 * Create a message for signing (to be used on frontend)
 * This is here for reference - frontend will implement this
 *
 * @param action - The action being performed
 * @param params - Parameters for the action
 * @returns Message string to sign
 */
export function createSignatureMessage(
  action: string,
  params: Record<string, any>
): string {
  const nonce = Date.now();
  const paramsStr = Object.entries(params)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");

  return `${action}\n${paramsStr}\nNonce: ${nonce}`;
}
