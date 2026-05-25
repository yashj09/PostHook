import { defineConfig } from "@wagmi/cli";
import { react } from "@wagmi/cli/plugins";
import GiftSenderAbi from "./src/abi/GiftSender.json";
import GiftRecipientAbi from "./src/abi/GiftRecipient.json";
import GiftHookAbi from "./src/abi/GiftHook.json";
import MockUSDTAbi from "./src/abi/MockUSDT.json";

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
] as const;

export default defineConfig({
  out: "src/generated/wagmi.ts",
  contracts: [
    { name: "GiftSender", abi: GiftSenderAbi as never },
    { name: "GiftRecipient", abi: GiftRecipientAbi as never },
    { name: "GiftHook", abi: GiftHookAbi as never },
    { name: "MockUSDT", abi: MockUSDTAbi as never },
    { name: "Erc20", abi: erc20Abi },
  ],
  plugins: [react()],
});
