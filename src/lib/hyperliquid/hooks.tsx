"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useHyperliquidStore } from "./store";
import { Address } from "viem";
import { toast } from "sonner";
import { generateAgentWallet } from "@/lib/crypto/wallet";
import { privateKeyToAccount } from "viem/accounts";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

// Initialize store on module load
if (typeof window !== "undefined") {
  useHyperliquidStore.getState().init();
}

export function useCheckUser(userAddress: Address) {
  const infoClient = useHyperliquidStore((state) => state.infoClient);

  return useQuery({
    queryKey: ["hyperliquid", "check-user"],
    queryFn: async () => {
      const resp = await infoClient?.userRole({ user: userAddress });
      return resp?.role === "user";
    },
    enabled: !!userAddress,
  });
}

export function useGetBalances(userAddress: Address) {
  const infoClient = useHyperliquidStore((state) => state.infoClient);
  return useQuery({
    queryKey: ["hyperliquid", "balances", userAddress],
    queryFn: async () => {
      return await infoClient?.spotClearinghouseState({ user: userAddress });
    },
    enabled: !!userAddress,
  });
}

/**
 * Hook to initialize exchange and agent clients
 * Only runs when user exists and is authenticated
 */
export function useInitializeAgent() {
  const initExchangeClient = useHyperliquidStore(
    (state) => state.initExchangeClient
  );
  const initAgentClient = useHyperliquidStore((state) => state.initAgentClient);
  const exchangeClient = useHyperliquidStore((state) => state.exchangeClient);
  const agentClient = useHyperliquidStore((state) => state.agentClient);
  const infoClient = useHyperliquidStore((state) => state.infoClient);
  const { address } = useAccount();

  const [data, setData] = useState<{
    agentAddress: Address;
    initialized: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only run if user exists and address is available
    if (!address) {
      return;
    }
    // Don't re-initialize if already initialized or currently loading
    if (data || isLoading) {
      return;
    }

    const initialize = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Get or generate agent private key
        // TODO: Replace localStorage with DB fetch later
        const saveKey = `agentPrivateKey-${address}`;
        let agentPrivateKey = localStorage.getItem(saveKey);

        if (!agentPrivateKey) {
          const { privateKey } = generateAgentWallet();
          agentPrivateKey = privateKey;
          localStorage.setItem(saveKey, privateKey);
        }

        // Step 2: Initialize exchange client (user's wallet)
        if (!exchangeClient) {
          await initExchangeClient();
        }

        // Step 3: Get agent account from private key
        const agentAccount = privateKeyToAccount(agentPrivateKey as Address);

        // Step 4: Check if agent is already approved
        let isApproved = false;
        if (infoClient && address) {
          try {
            const resp = await infoClient.extraAgents({
              user: address as Address,
            });
            if (resp) {
              const found = resp.find(
                (agent) => agent.address === agentAccount.address
              );
              isApproved = !!found;
            }
          } catch (error) {
            console.warn("Failed to check agent status:", error);
            // Continue with approval attempt if check fails
          }
        }

        // Step 5: Approve agent only if not already approved
        if (!isApproved) {
          const currentExchangeClient =
            useHyperliquidStore.getState().exchangeClient;
          if (currentExchangeClient) {
            try {
              await currentExchangeClient.approveAgent({
                agentAddress: agentAccount.address,
                agentName: "EzDawg Agent",
              });
              console.log("Agent approved");
            } catch (error: any) {
              // If approval fails, log but don't throw - agent might already be approved
              console.warn(
                "Agent approval failed (might already be approved):",
                error
              );
            }
          }
        } else {
          console.log("Agent already approved, skipping approval step");
        }

        // Step 6: Initialize agent client
        if (!agentClient) {
          initAgentClient(agentAccount);
        }

        setData({
          agentAddress: agentAccount.address,
          initialized: true,
        });
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to initialize agent");
        setError(error);
        console.error("Agent initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [
    address,
    data,
    isLoading,
    exchangeClient,
    agentClient,
    infoClient,
    initExchangeClient,
    initAgentClient,
  ]);

  return {
    data,
    isLoading,
    error,
  };
}

export function useGetAgentStatus(agentAddress?: Address) {
  const infoClient = useHyperliquidStore((state) => state.infoClient);
  const { address } = useAccount();

  return useQuery({
    queryKey: ["hyperliquid", "agent-status", address, agentAddress],
    enabled: !!address && !!agentAddress,
    queryFn: async () => {
      if (!address || !agentAddress || !infoClient) {
        return false;
      }

      const resp = await infoClient.extraAgents({
        user: address as Address,
      });

      if (!resp) {
        return false;
      }

      const found = resp.find((agent) => agent.address === agentAddress);
      return !!found;
    },
  });
}

export function useApproveAgent() {
  const exchangeClient = useHyperliquidStore((state) => state.exchangeClient);

  return useMutation({
    mutationKey: ["hyperliquid", "approve-agent"],
    mutationFn: async (agentAddress: Address) => {
      if (!exchangeClient) {
        throw new Error("Exchange client not initialized");
      }
      return await exchangeClient.approveAgent({
        agentAddress,
        agentName: "EzDawg Investment Agent",
      });
    },
    onSuccess: () => {
      toast.success("Agent approved successfully", {
        description: "You can now use the agent to trade",
      });
    },
    onError: (error: any) => {
      toast.error("Failed to approve agent", {
        description: error?.message || "Please try again",
      });
    },
  });
}

/**
 * Hook to fetch spot metadata from Hyperliquid
 */
export function useSpotMetadata() {
  const infoClient = useHyperliquidStore((state) => state.infoClient);

  return useQuery({
    queryKey: ["hyperliquid", "spot-metadata"],
    queryFn: async () => {
      return await infoClient?.spotMeta();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch all mid prices
 */
export function useAllMids() {
  const infoClient = useHyperliquidStore((state) => state.infoClient);

  return useQuery({
    queryKey: ["hyperliquid", "all-mids"],
    queryFn: async () => {
      return await infoClient?.allMids();
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

/**
 * Hook to get spot asset by index
 */
export function useSpotAssetByIndex(assetIndex: number | undefined) {
  const { data: spotMeta } = useSpotMetadata();

  return useQuery({
    queryKey: ["hyperliquid", "spot-asset", "index", assetIndex],
    queryFn: async () => {
      if (!spotMeta || assetIndex === undefined) return null;
      return spotMeta.universe.find((u: any) => u.index === assetIndex) || null;
    },
    enabled: !!spotMeta && assetIndex !== undefined,
  });
}

/**
 * Hook to get spot asset by name
 */
export function useSpotAssetByName(assetName: string | undefined) {
  const { data: spotMeta } = useSpotMetadata();

  return useQuery({
    queryKey: ["hyperliquid", "spot-asset", "name", assetName],
    queryFn: async () => {
      if (!spotMeta || !assetName) return null;
      return (
        spotMeta.universe.find(
          (u: any) => u.name.toUpperCase() === assetName.toUpperCase()
        ) || null
      );
    },
    enabled: !!spotMeta && !!assetName,
  });
}

/**
 * Hook to get current price for an asset
 */
export function useAssetPrice(assetName: string | undefined) {
  const { data: allMids } = useAllMids();

  return useQuery({
    queryKey: ["hyperliquid", "asset-price", assetName],
    queryFn: async () => {
      if (!allMids || !assetName) return null;
      return allMids[assetName] || null;
    },
    enabled: !!allMids && !!assetName,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
}
