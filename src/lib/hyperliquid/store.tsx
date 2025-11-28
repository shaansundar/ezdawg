import { create } from "zustand";
import * as hl from "@nktkas/hyperliquid";
import { Address, createWalletClient, custom, PrivateKeyAccount } from "viem";

interface HyperliquidStore {
  // Read-only info client (no private key needed)
  infoClient: hl.InfoClient | null;
  exchangeClient: hl.ExchangeClient | null;
  agentClient: hl.ExchangeClient | null;

  // Initialize all clients and setup
  init: (options?: { isTestnet?: boolean }) => void;
  initExchangeClient: () => Promise<void>;
  initAgentClient: (agentWallet: PrivateKeyAccount) => void;
}

const globalTransport = new hl.WebSocketTransport({ isTestnet: false });

export const useHyperliquidStore = create<HyperliquidStore>((set, get) => ({
  infoClient: null,
  exchangeClient: null,
  agentClient: null,

  init: (options = {}) => {
    const infoClient = new hl.InfoClient({ transport: globalTransport });
    set({
      infoClient,
    });
  },

  initExchangeClient: async () => {
    const [account] = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as `0x${string}`[];
    const externalWallet = createWalletClient({
      account,
      transport: custom(window.ethereum),
    });
    const exchangeClient = new hl.ExchangeClient({
      transport: globalTransport,
      wallet: externalWallet,
    });
    set({ exchangeClient });
  },

  initAgentClient: (agentWallet: PrivateKeyAccount) => {
    console.log("🚀 ~ initAgentClient ~ agentWallet:", agentWallet);
    const agentClient = new hl.ExchangeClient({
      transport: globalTransport,
      wallet: agentWallet,
    });
    set({ agentClient });
  },
}));
