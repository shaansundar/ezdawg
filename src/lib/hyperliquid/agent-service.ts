/**
 * Agent initialization service layer
 *
 * This module contains all business logic for initializing Hyperliquid agents.
 * All functions are pure and can be tested independently of React.
 *
 * @module agent-service
 */

import { Address } from "viem";
import { privateKeyToAccount, PrivateKeyAccount } from "viem/accounts";
import { generateAgentWallet } from "@/lib/crypto/wallet";
import {
  getAgentPrivateKey,
  saveAgentPrivateKey,
} from "@/lib/storage/agent-storage";
import * as hl from "@nktkas/hyperliquid";

/**
 * Result of agent initialization
 */
export interface AgentInitResult {
  agentAddress: Address;
  initialized: boolean;
}

/**
 * Parameters for initializing an agent
 */
export interface InitializeAgentParams {
  userAddress: Address;
  infoClient: hl.InfoClient | null;
  exchangeClient: hl.ExchangeClient | null;
  initExchangeClient: () => Promise<void>;
  initAgentClient: (agentWallet: PrivateKeyAccount) => void;
}

/**
 * Get existing agent private key or create a new one
 *
 * @param userAddress - The user's wallet address
 * @returns The agent's private key
 */
export function getOrCreateAgentPrivateKey(userAddress: Address): string {
  // Try to get existing key
  const existingKey = getAgentPrivateKey(userAddress);

  if (existingKey) {
    return existingKey;
  }

  // Generate new wallet and save
  const { privateKey } = generateAgentWallet();
  saveAgentPrivateKey(userAddress, privateKey);

  return privateKey;
}

/**
 * Create an agent account from a private key
 *
 * @param privateKey - The agent's private key
 * @returns The agent account
 */
export function createAgentAccount(privateKey: string): PrivateKeyAccount {
  return privateKeyToAccount(privateKey as Address);
}

/**
 * Check if an agent is already approved for a user
 *
 * @param infoClient - Hyperliquid info client
 * @param userAddress - The user's wallet address
 * @param agentAddress - The agent's wallet address
 * @returns true if agent is approved, false otherwise
 */
export async function checkAgentApproval(
  infoClient: hl.InfoClient | null,
  userAddress: Address,
  agentAddress: Address
): Promise<boolean> {
  if (!infoClient) {
    return false;
  }

  try {
    const resp = await infoClient.extraAgents({ user: userAddress });

    if (!resp) {
      return false;
    }

    const found = resp.find((agent: any) => agent.address === agentAddress);
    return !!found;
  } catch (error) {
    console.warn("Failed to check agent approval status:", error);
    return false;
  }
}

/**
 * Approve an agent if it's not already approved
 *
 * @param exchangeClient - Hyperliquid exchange client
 * @param agentAddress - The agent's wallet address
 * @param isApproved - Whether the agent is already approved
 */
export async function approveAgentIfNeeded(
  exchangeClient: hl.ExchangeClient | null,
  agentAddress: Address,
  isApproved: boolean
): Promise<void> {
  if (isApproved) {
    console.log("Agent already approved, skipping approval step");
    return;
  }

  if (!exchangeClient) {
    throw new Error("Exchange client not initialized");
  }

  try {
    await exchangeClient.approveAgent({
      agentAddress,
      agentName: "EzDawg Agent",
    });
    console.log("Agent approved successfully");
  } catch (error: any) {
    // If approval fails, log but don't throw - agent might already be approved
    console.warn(
      "Agent approval failed (might already be approved):",
      error?.message || error
    );
  }
}

/**
 * Main orchestrator function that initializes an agent
 *
 * This function coordinates all the steps required to initialize an agent:
 * 1. Get or create agent private key
 * 2. Initialize exchange client (user's wallet)
 * 3. Create agent account from private key
 * 4. Check if agent is already approved
 * 5. Approve agent if needed
 * 6. Initialize agent client
 *
 * @param params - Initialization parameters
 * @returns Agent initialization result
 */
export async function initializeAgent(
  params: InitializeAgentParams
): Promise<AgentInitResult> {
  const {
    userAddress,
    infoClient,
    exchangeClient,
    initExchangeClient,
    initAgentClient,
  } = params;

  // Step 1: Get or create agent private key
  const agentPrivateKey = getOrCreateAgentPrivateKey(userAddress);

  // Step 2: Initialize exchange client (user's wallet)
  if (!exchangeClient) {
    await initExchangeClient();
  }

  // Step 3: Create agent account from private key
  const agentAccount = createAgentAccount(agentPrivateKey);

  // Step 4: Check if agent is already approved
  const isApproved = await checkAgentApproval(
    infoClient,
    userAddress,
    agentAccount.address
  );

  // Step 5: Approve agent if needed
  // Get the latest exchange client from params in case it was just initialized
  await approveAgentIfNeeded(exchangeClient, agentAccount.address, isApproved);

  // Step 6: Initialize agent client
  initAgentClient(agentAccount);

  return {
    agentAddress: agentAccount.address,
    initialized: true,
  };
}
