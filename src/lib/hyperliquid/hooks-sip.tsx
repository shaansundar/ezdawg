"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useSignMessage } from "wagmi";
import { getUserSIPs, updateSIPStatus } from "./sip-service";
import { toast } from "sonner";

/**
 * Hook to fetch user's SIPs
 */
export function useUserSIPs() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["sips", address],
    queryFn: async () => {
      if (!address) return [];
      return await getUserSIPs(address);
    },
    enabled: !!address,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

/**
 * Hook to delete (cancel) a SIP
 */
export function useCancelSIP() {
  const queryClient = useQueryClient();
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();

  return useMutation({
    mutationKey: ["cancel-sip"],
    mutationFn: async (sipId: string) => {
      if (!signMessageAsync) {
        throw new Error("Wallet not connected");
      }

      return await updateSIPStatus(sipId, "cancelled", async (message: string) => {
        const signature = await signMessageAsync({ message });
        return signature;
      });
    },
    onSuccess: () => {
      toast.success("SIP cancelled successfully");
      // Invalidate and refetch SIPs
      queryClient.invalidateQueries({ queryKey: ["sips", address] });
    },
    onError: (error: any) => {
      toast.error("Failed to cancel SIP", {
        description: error?.message || "Please try again",
      });
    },
  });
}

/**
 * Hook to pause a SIP
 */
export function usePauseSIP() {
  const queryClient = useQueryClient();
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();

  return useMutation({
    mutationKey: ["pause-sip"],
    mutationFn: async (sipId: string) => {
      if (!signMessageAsync) {
        throw new Error("Wallet not connected");
      }

      return await updateSIPStatus(sipId, "paused", async (message: string) => {
        const signature = await signMessageAsync({ message });
        return signature;
      });
    },
    onSuccess: () => {
      toast.success("SIP paused successfully");
      queryClient.invalidateQueries({ queryKey: ["sips", address] });
    },
    onError: (error: any) => {
      toast.error("Failed to pause SIP", {
        description: error?.message || "Please try again",
      });
    },
  });
}

/**
 * Hook to resume (activate) a paused SIP
 */
export function useResumeSIP() {
  const queryClient = useQueryClient();
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();

  return useMutation({
    mutationKey: ["resume-sip"],
    mutationFn: async (sipId: string) => {
      if (!signMessageAsync) {
        throw new Error("Wallet not connected");
      }

      return await updateSIPStatus(sipId, "active", async (message: string) => {
        const signature = await signMessageAsync({ message });
        return signature;
      });
    },
    onSuccess: () => {
      toast.success("SIP resumed successfully");
      queryClient.invalidateQueries({ queryKey: ["sips", address] });
    },
    onError: (error: any) => {
      toast.error("Failed to resume SIP", {
        description: error?.message || "Please try again",
      });
    },
  });
}
