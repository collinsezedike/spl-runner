import {
	Connection,
	Keypair,
	PublicKey,
	TransactionMessage,
	VersionedTransaction,
} from "@solana/web3.js";
import {
	getOrCreateAssociatedTokenAccount,
	createTransferInstruction,
} from "@solana/spl-token";
import bs58 from "bs58";
import { CLUSTER_URL, MINT_ADDRESS, PROGRAM_SECRET_KEY } from ".";

const MINT = new PublicKey(MINT_ADDRESS!);
const tokenDecimal = 10;

export const transferToken = async (recipient: string, amount: number) => {
	try {
		const connection = new Connection(CLUSTER_URL);
		const toWallet = new PublicKey(recipient);

		const programAccount = Keypair.fromSecretKey(
			bs58.decode(PROGRAM_SECRET_KEY!)
		);

		const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			programAccount,
			MINT,
			programAccount.publicKey
		);

		const toTokenAccount = await getOrCreateAssociatedTokenAccount(
			connection,
			programAccount,
			MINT,
			toWallet
		);

		const tokenTransferIxn = createTransferInstruction(
			fromTokenAccount.address,
			toTokenAccount.address,
			programAccount.publicKey,
			amount * Math.pow(10, tokenDecimal)
		);

		const { blockhash } = await connection.getLatestBlockhash();

		const message = new TransactionMessage({
			payerKey: programAccount.publicKey,
			recentBlockhash: blockhash,
			instructions: [tokenTransferIxn],
		}).compileToV0Message();

		const transaction = new VersionedTransaction(message);
		return transaction;
	} catch (error: any) {
		return error.message ? error.message : error;
	}
};
