/**
 * Storage abstraction for agent private keys
 *
 * This module provides a clean interface for storing and retrieving agent private keys.
 * Currently uses localStorage, but can be easily migrated to database storage in the future
 * without changing any business logic code.
 *
 * @module agent-storage
 */

/**
 * Get the agent private key for a specific user address
 *
 * @param userAddress - The user's wallet address
 * @returns The agent's private key if found, null otherwise
 */
export function getAgentPrivateKey(userAddress: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storageKey = `agentPrivateKey-${userAddress}`;
  return localStorage.getItem(storageKey);
}

/**
 * Save an agent private key for a specific user address
 *
 * @param userAddress - The user's wallet address
 * @param privateKey - The agent's private key to store
 */
export function saveAgentPrivateKey(
  userAddress: string,
  privateKey: string
): void {
  if (typeof window === "undefined") {
    throw new Error("Cannot save private key in non-browser environment");
  }

  const storageKey = `agentPrivateKey-${userAddress}`;
  localStorage.setItem(storageKey, privateKey);
}

/**
 * Remove the agent private key for a specific user address
 *
 * @param userAddress - The user's wallet address
 */
export function removeAgentPrivateKey(userAddress: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = `agentPrivateKey-${userAddress}`;
  localStorage.removeItem(storageKey);
}

/**
 * Check if an agent private key exists for a specific user address
 *
 * @param userAddress - The user's wallet address
 * @returns true if a key exists, false otherwise
 */
export function hasAgentPrivateKey(userAddress: string): boolean {
  return getAgentPrivateKey(userAddress) !== null;
}
