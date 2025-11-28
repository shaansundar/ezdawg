"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { Wallet, TrendingUp, Clock, AlertCircle, Link, RefreshCw } from "lucide-react";
import { useCheckUser, useInitializeAgent } from "@/lib/hyperliquid/hooks";
import { useRouter } from "next/navigation";
import { SpotBalancesTable } from "@/components/dashboard/spot-balances-table";

export default function DashboardPage() {
  const { address } = useAccount();
  const router = useRouter();

  if (!address) {
    router.push("/");
    return;
  }

  // Call all hooks unconditionally
  const { data: isUser, isLoading: isCheckingUser } = useCheckUser(address);
  const {
    data: agentData,
    isLoading: isInitializingAgent,
    error: initError,
    refetch: retryInitialization,
  } = useInitializeAgent();

  // Show loading state while checking user or initializing agent
  if (!address || isCheckingUser || isInitializingAgent) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show error if user doesn't have Hyperliquid account
  if (isUser === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner p-8 border border-gray-200">
        <h1 className="text-2xl font-semibold text-red-600 flex items-center gap-2 mb-4">
          <AlertCircle className="w-6 h-6" /> Hyperliquid Account Not Found
        </h1>
        <p className="text-gray-700 text-base mb-2 text-center">
          It looks like you haven't created a Hyperliquid account yet.
        </p>
        <p className="text-gray-600 text-sm text-center mb-4">
          To continue, please visit the official site below and create your
          account.
        </p>
        <a
          href="https://app.hyperliquid.xyz/trade"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700 transition"
        >
          <Link className="w-4 h-4" /> Go to hyperliquid.xyz
        </a>
      </div>
    );
  }

  // Show error if agent initialization failed
  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] rounded-lg bg-gradient-to-br from-red-50 to-red-100 shadow-inner p-8 border border-red-200">
        <h1 className="text-2xl font-semibold text-red-600 flex items-center gap-2 mb-4">
          <AlertCircle className="w-6 h-6" /> Initialization Error
        </h1>
        <p className="text-gray-700 text-base mb-2 text-center">
          Failed to initialize agent client.
        </p>
        <p className="text-gray-600 text-sm text-center mb-4">
          {initError instanceof Error
            ? initError.message
            : "Unknown error occurred"}
        </p>
        <Button
          onClick={() => retryInitialization()}
          className="inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Initialization
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back</p>
      </div>

      <SpotBalancesTable address={address} />

      {agentData && (
        <div className="text-sm text-muted-foreground">
          <p>Agent Address: {agentData.agentAddress}</p>
          <p>Initialized: {agentData.initialized ? "Yes" : "No"}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <StatCard label="Active SIPs" value={0} icon={Wallet} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <StatCard
            label="Total Invested"
            value="$0"
            icon={TrendingUp}
            iconColor="text-emerald-600"
            iconBgColor="bg-emerald-50"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <StatCard
            label="Executions"
            value={0}
            icon={Clock}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <StatCard
            label="Failed"
            value={0}
            icon={AlertCircle}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-50"
          />
        </div>
      </div>
    </div>
  );
}
