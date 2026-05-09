// Lightweight global state for Sochal. Real Solana wallet detection + local profile.
// On-chain integration hooks are commented inline (Anchor program calls, PDA derivation).
import { useSyncExternalStore } from "react";

export type Role = "fan" | "creator";
export type Topic = "Singing" | "Dancing" | "Comedy" | "Rap" | "Gaming" | "Cooking";

export const TOPICS: Topic[] = ["Singing", "Dancing", "Comedy", "Rap", "Gaming", "Cooking"];

export type WalletProvider = "Phantom" | "Backpack" | "Solflare";

export interface SochalProfile {
  handle: string;          // @handle, unique per wallet (TODO: enforce on-chain via Profile PDA)
  displayName: string;
  bio?: string;
  createdAt: number;
}

export interface LiveStream {
  id: string;              // PDA address (mock for now)
  ownerWallet: string;
  handle: string;
  displayName: string;
  topic: Topic;
  title: string;
  startedAt: number;
  isLive: boolean;
  potSol: number;
  targetSol: number;
  viewers: number;
}

interface SochalState {
  wallet: { address: string; provider: WalletProvider } | null;
  profile: SochalProfile | null;
  role: Role | null;
  topic: Topic | null;
  streams: LiveStream[];   // local mirror; backend should hydrate from chain/indexer
}

const KEY = "sochal:state:v2";
const initial: SochalState = { wallet: null, profile: null, role: null, topic: null, streams: [] };

let state: SochalState = initial;
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...initial, ...JSON.parse(raw) };
  } catch {}
}

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const persist = () => {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
};

// ---------- Real Solana wallet detection ----------
// These wallets inject providers into window. We talk to them directly so users
// connect their actual on-chain account — no mock addresses.
type InjectedProvider = {
  isPhantom?: boolean;
  publicKey?: { toString(): string };
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
};

function getInjected(provider: WalletProvider): InjectedProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  switch (provider) {
    case "Phantom":
      return w.phantom?.solana ?? (w.solana?.isPhantom ? w.solana : null);
    case "Backpack":
      return w.backpack?.solana ?? w.xnft?.solana ?? null;
    case "Solflare":
      return w.solflare ?? null;
  }
}

export const WALLET_INSTALL_URL: Record<WalletProvider, string> = {
  Phantom: "https://phantom.app/download",
  Backpack: "https://backpack.app/downloads",
  Solflare: "https://solflare.com/download",
};

export function isWalletInstalled(provider: WalletProvider): boolean {
  return !!getInjected(provider);
}

export const sochal = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },

  /** Connect to a real injected Solana wallet. Throws if not installed. */
  connect: async (provider: WalletProvider) => {
    const injected = getInjected(provider);
    if (!injected) {
      const err = new Error(`${provider} wallet not detected`);
      (err as any).code = "WALLET_NOT_INSTALLED";
      throw err;
    }
    const res = await injected.connect();
    const address = res.publicKey?.toString() ?? injected.publicKey?.toString();
    if (!address) throw new Error(`${provider} did not return a public key`);
    state = { ...state, wallet: { address, provider } };
    persist();
    emit();
  },

  disconnect: async () => {
    if (state.wallet) {
      try {
        await getInjected(state.wallet.provider)?.disconnect();
      } catch {}
    }
    state = { ...initial };
    persist();
    emit();
  },

  /** Create or update the user's Sochal profile.
   *  TODO: persist to on-chain Profile PDA (seeds = ["profile", wallet]). */
  saveProfile: (p: Omit<SochalProfile, "createdAt"> & { createdAt?: number }) => {
    state = {
      ...state,
      profile: { ...p, createdAt: p.createdAt ?? Date.now() },
    };
    persist();
    emit();
  },

  setRole: (role: Role) => {
    state = { ...state, role };
    persist();
    emit();
  },

  setTopic: (topic: Topic) => {
    state = { ...state, topic };
    persist();
    emit();
  },

  /** Start a live stream. TODO: replace with Anchor `init_live(topic, title, target)`
   *  + open 100ms/Agora room and store the room id alongside the PDA. */
  startStream: (input: { topic: Topic; title: string; targetSol: number }) => {
    if (!state.wallet || !state.profile) throw new Error("Wallet + profile required");
    const stream: LiveStream = {
      id: `local_${Date.now()}`,
      ownerWallet: state.wallet.address,
      handle: state.profile.handle,
      displayName: state.profile.displayName,
      topic: input.topic,
      title: input.title,
      startedAt: Date.now(),
      isLive: true,
      potSol: 0,
      targetSol: input.targetSol,
      viewers: 0,
    };
    state = { ...state, streams: [stream, ...state.streams] };
    persist();
    emit();
    return stream;
  },

  endStream: (id: string) => {
    state = {
      ...state,
      streams: state.streams.map((s) => (s.id === id ? { ...s, isLive: false } : s)),
    };
    persist();
    emit();
  },
};

export function useSochal() {
  return useSyncExternalStore(
    sochal.subscribe,
    () => sochal.get(),
    () => initial,
  );
}

export const shortAddr = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;
