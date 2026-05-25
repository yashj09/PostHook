/**
 * Bearer-style claim secrets. Sender generates 4 friendly words; the contract
 * stores keccak256(secret) as the commitment. Recipient reveals the secret to
 * claim. The wordlist is deliberately small + warm — Postcard, Kettle, Anchor —
 * so the resulting phrase reads like a memo rather than a password.
 */

import { keccak256, toBytes, type Hex } from "viem";

const words = [
  "Anchor",
  "Atlas",
  "Bramble",
  "Cardinal",
  "Cobalt",
  "Cypress",
  "Daisy",
  "Driftwood",
  "Ember",
  "Estuary",
  "Falcon",
  "Foxglove",
  "Gable",
  "Grove",
  "Harbor",
  "Heath",
  "Indigo",
  "Ivory",
  "Junco",
  "Kestrel",
  "Lantern",
  "Linden",
  "Marigold",
  "Meadow",
  "Nimbus",
  "Oak",
  "Pearl",
  "Postcard",
  "Quince",
  "Robin",
  "Saffron",
  "Sparrow",
  "Tamarind",
  "Thistle",
  "Umber",
  "Vesper",
  "Willow",
  "Xanthe",
  "Yarrow",
  "Zephyr",
];

function pickWord(rand: () => number) {
  return words[Math.floor(rand() * words.length)];
}

function cryptoRandom(): () => number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return () => {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      return arr[0]! / 0x100000000;
    };
  }
  return Math.random;
}

/** Returns 4 hyphen-separated words like "Postcard-Heath-Ember-Cobalt". */
export function generateSecretPhrase(): string {
  const rand = cryptoRandom();
  return [pickWord(rand), pickWord(rand), pickWord(rand), pickWord(rand)].join("-");
}

/** keccak256 of the UTF-8 bytes of the phrase. */
export function commitmentOf(phrase: string): Hex {
  return keccak256(toBytes(phrase));
}

/** Hex-encoded UTF-8 bytes of the phrase, for passing as `bytes calldata`. */
export function secretBytes(phrase: string): Hex {
  const encoded = new TextEncoder().encode(phrase);
  return ("0x" + Array.from(encoded, (b) => b.toString(16).padStart(2, "0")).join("")) as Hex;
}
