import { clusterApiUrl } from "@solana/web3.js";

export const CLUSTER_URL = process.env.RPC_URL || clusterApiUrl("devnet");
export const MINT_ADDRESS = process.env.MINT_ADDRESS!;
export const PROGRAM_SECRET_KEY = process.env.PROGRAM_SECRET_KEY!;
