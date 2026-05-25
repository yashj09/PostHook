"use client";

import { http } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { unichainSepolia, baseSepolia } from "./chains";

export { unichainSepolia, baseSepolia };

export const wagmiConfig = getDefaultConfig({
  appName: "Posthook",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "posthook-dev",
  chains: [unichainSepolia, baseSepolia],
  transports: {
    [unichainSepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});
