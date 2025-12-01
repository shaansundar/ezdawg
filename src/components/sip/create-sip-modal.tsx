"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSpotMetadata, useAllMids } from "@/lib/hyperliquid/hooks";
import { Loader2, Plus } from "lucide-react";
import { useSignMessage } from "wagmi";
import { createSIP } from "@/lib/hyperliquid/sip-service";
import { toast } from "sonner";

export function CreateSipModal() {
  const [open, setOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [monthlyAmount, setMonthlyAmount] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: spotMeta, isLoading: isLoadingMeta } = useSpotMetadata();
  const { data: allMids, isLoading: isLoadingPrices } = useAllMids();
  const { signMessageAsync } = useSignMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate monthly amount
    const amount = parseFloat(monthlyAmount);
    if (isNaN(amount) || amount < 1000) {
      setError("Monthly investment must be at least 1000 USDC");
      return;
    }

    if (!selectedAsset) {
      setError("Please select an asset");
      return;
    }

    // Find the selected asset to get its index
    const selectedAssetData = assetsWithPrices.find(
      (asset) => asset?.name === selectedAsset
    );

    if (!selectedAssetData) {
      setError("Invalid asset selected");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create SIP with signature verification
      const result = await createSIP({
        assetName: selectedAsset,
        assetIndex: selectedAssetData.index,
        monthlyAmountUsdc: amount,
        signMessage: async (message: string) => {
          const signature = await signMessageAsync({
            message,
          });
          return signature;
        },
      });

      if (result.success) {
        toast.success("SIP created successfully", {
          description: `Monthly investment of ${amount} USDC in ${selectedAsset}`,
        });

        // Reset form and close modal
        setSelectedAsset("");
        setMonthlyAmount("");
        setOpen(false);
      } else {
        setError(result.error || "Failed to create SIP");
      }
    } catch (error: any) {
      console.error("SIP creation error:", error);
      setError(error.message || "Failed to create SIP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isLoadingMeta || isLoadingPrices;

  // Get sorted assets with prices
  const assetsWithPrices =
    spotMeta && allMids
      ? spotMeta.universe
          .map((pair: any) => {
            const tokenIndex = pair.tokens[0]; // Base token index
            const token = spotMeta.tokens[tokenIndex];
            if (!token) return null;

            return {
              name: token.name,
              index: pair.index,
              price: allMids[`@${pair.index}`] || "N/A",
            };
          })
          .filter(Boolean) // Remove nulls
          .sort((a: any, b: any) => a.name.localeCompare(b.name))
      : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Start new SIP
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New SIP</DialogTitle>
          <DialogDescription>
            Set up a systematic investment plan for spot assets on Hyperliquid.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Asset Selection */}
            <div className="space-y-2">
              <Label htmlFor="asset">Select Asset</Label>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                  <SelectTrigger id="asset">
                    <SelectValue placeholder="Choose an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetsWithPrices.map((asset) => (
                      <SelectItem key={asset?.index} value={asset?.name || ""}>
                        {asset?.name} - ${asset?.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Monthly Investment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Monthly Investment (USDC)</Label>
              <Input
                id="amount"
                type="number"
                min="1000"
                step="1"
                placeholder="Min. 1000 USDC"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Minimum investment: 1000 USDC
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create SIP"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
