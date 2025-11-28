"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useHyperliquidStore } from "./store";
import { Address } from "viem";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { initializeAgent } from "./agent-service";

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
 * Uses React Query for automatic retries and better state management
 */
export function useInitializeAgent() {
  const { address } = useAccount();
  const initExchangeClient = useHyperliquidStore(
    (state) => state.initExchangeClient
  );
  const initAgentClient = useHyperliquidStore((state) => state.initAgentClient);
  const exchangeClient = useHyperliquidStore((state) => state.exchangeClient);
  const infoClient = useHyperliquidStore((state) => state.infoClient);

  return useQuery({
    queryKey: ["hyperliquid", "initialize-agent", address],
    queryFn: async () => {
      if (!address) {
        throw new Error("No wallet connected");
      }

      return await initializeAgent({
        userAddress: address,
        infoClient,
        exchangeClient,
        initExchangeClient,
        initAgentClient,
      });
    },
    enabled: !!address,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: Infinity, // Never refetch once successful
  });
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
