import { type Header } from '@ergo-graphql/types';
import type { SignedInput } from '@fleet-sdk/common';
import {
	ErgoBoxes,
	ErgoStateContext,
	Transaction,
	TransactionHintsBag,
	UnsignedTransaction,
	Wallet
} from 'ergo-lib-wasm-nodejs';
import JSONBig from 'json-bigint';
import Bip32 from './bip32';
import { MAINNET } from './ergo';
import type {
	ProverDeviceState,
	SigningState,
	StateAddress
} from '../../types/internal';
import { toBigNumber } from './utils/bigNumbers';
import { wasmModule } from './utils/wasm-module';
import type { ErgoTx, UnsignedTx } from './connector';

export type PartialSignState = Omit<Partial<SigningState>, 'device'> & {
	device?: Partial<ProverDeviceState>;
};

export class Prover {
	private _from!: StateAddress[];
	private _useLedger!: boolean;
	private _changeIndex!: number;
	private _deriver!: Bip32;
	private _callbackFn?: (newVal: PartialSignState) => void;

	public constructor(deriver: Bip32) {
		this._deriver = deriver;
		this._useLedger = false;
	}

	public from(addresses: StateAddress[]): Prover {
		this._from = addresses;
		return this;
	}

	public changeIndex(index: number): Prover {
		this._changeIndex = index;
		return this;
	}

	public setCallback<T>(callback?: (newState: T) => void): Prover {
		if (callback) {
			this._callbackFn = callback as (newVal: unknown) => void;
		}

		return this;
	}

	public useLedger(use = true): Prover {
		this._useLedger = use;
		return this;
	}

	public signMessage(message: string) {
		const wallet = this.buildWallet(this._from, this._deriver);
		const address = MAINNET
			? wasmModule.SigmaRust.Address.from_mainnet_str(
					this._from[0].script
				)
			: wasmModule.SigmaRust.Address.from_testnet_str(
					this._from[0].script
				);

		return wallet.sign_message_using_p2pk(
			address,
			Buffer.from(message, 'utf-8')
		);
	}

	public async sign(
		unsignedTx: UnsignedTx,
		headers: Header[]
	): Promise<ErgoTx> {
		const sigmaRust = wasmModule.SigmaRust;
		const unspentBoxes = sigmaRust.ErgoBoxes.from_boxes_json(
			unsignedTx.inputs
		);
		const dataInputBoxes = sigmaRust.ErgoBoxes.from_boxes_json(
			unsignedTx.dataInputs
		);
		const tx = sigmaRust.UnsignedTransaction.from_json(
			JSONBig.stringify(unsignedTx)
		);
		const signed = await this._sign(
			tx,
			unspentBoxes,
			dataInputBoxes,
			headers
		);

		return JSONBig.parse(signed.to_json());
	}

	public async signInputs(
		unsignedTx: UnsignedTx,
		headers: Header[],
		inputsToSign: number[]
	): Promise<SignedInput[]> {
		inputsToSign = inputsToSign.sort();
		const sigmaRust = wasmModule.SigmaRust;
		const unspentBoxes = sigmaRust.ErgoBoxes.from_boxes_json(
			unsignedTx.inputs
		);
		const dataInputBoxes = sigmaRust.ErgoBoxes.from_boxes_json(
			unsignedTx.dataInputs
		);
		const tx = sigmaRust.UnsignedTransaction.from_json(
			JSONBig.stringify(unsignedTx)
		);
		const signed = this._signInputs(
			tx,
			unspentBoxes,
			dataInputBoxes,
			headers,
			inputsToSign
		);

		return signed;
	}

	public generateCommitments(tx) {
		const wallet = this.buildWallet(this._from, this._deriver);
		const commitments =
			wallet.generate_commitments_for_reduced_transaction(tx);
		return this._extractCommitments(
			commitments,
			tx.unsigned_tx().inputs().len()
		);
	}

	public generatePlainCommitments(tx): TransactionHintsBag {
		const wallet = this.buildWallet(this._from, this._deriver);
		return wallet.generate_commitments_for_reduced_transaction(tx);
	}

	public signReducedMulti(tx, hints): Transaction {
		const wallet = this.buildWallet(this._from, this._deriver);
		return wallet.sign_reduced_transaction_multi(tx, hints);
	}

	private _extractCommitments = (
		commitment: TransactionHintsBag,
		inputLength: number
	) => {
		const tx_known = wasmModule.SigmaRust.TransactionHintsBag.empty();
		const tx_own = wasmModule.SigmaRust.TransactionHintsBag.empty();
		for (let index = 0; index < inputLength; index++) {
			const input_commitments = commitment.all_hints_for_input(index);
			const input_known = wasmModule.SigmaRust.HintsBag.empty();
			if (input_commitments.len() > 0) {
				input_known.add_commitment(input_commitments.get(0));
				tx_known.add_hints_for_input(index, input_known);
			}
			const input_own = wasmModule.SigmaRust.HintsBag.empty();
			if (input_commitments.len() > 1) {
				input_own.add_commitment(input_commitments.get(1));
				tx_own.add_hints_for_input(index, input_own);
			}
		}
		return {
			public: tx_known,
			private: tx_own
		};
	};

	private async _sign(
		unsigned: UnsignedTransaction,
		unspentBoxes: ErgoBoxes,
		dataInputBoxes: ErgoBoxes,
		headers: Header[]
	) {
		const sigmaRust = wasmModule.SigmaRust;

		const wallet = this.buildWallet(this._from, this._deriver);
		const blockHeaders = sigmaRust.BlockHeaders.from_json(
			headers.map((x) => {
				return {
					...x,
					id: x.headerId,
					timestamp: toBigNumber(x.timestamp).toNumber(),
					nBits: toBigNumber(x.nBits).toNumber(),
					votes: Buffer.from(x.votes).toString('hex')
				};
			})
		);

		const preHeader = sigmaRust.PreHeader.from_block_header(
			blockHeaders.get(0)
		);
		const signContext = new sigmaRust.ErgoStateContext(
			preHeader,
			blockHeaders
		);

		const signed = wallet.sign_transaction(
			signContext,
			unsigned,
			unspentBoxes,
			dataInputBoxes
		);
		return signed;
	}

	public signMulti(
		tx: Transaction,
		context: ErgoStateContext,
		hints: TransactionHintsBag
	) {
		const wallet = this.buildWallet(this._from, this._deriver);
		const sigmaRust = wasmModule.SigmaRust;
		const dataInputBoxes = [];
		return wallet.sign_transaction_multi(
			context,
			tx,
			tx.inputs,
			dataInputBoxes,
			hints
		);
		//  sign_transaction_multi(_state_context: ErgoStateContext, tx: UnsignedTransaction, boxes_to_spend: ErgoBoxes, data_boxes: ErgoBoxes, tx_hints: TransactionHintsBag): Transaction;
	}

	private _signInputs(
		unsigned: UnsignedTransaction,
		unspentBoxes: ErgoBoxes,
		dataInputBoxes: ErgoBoxes,
		headers: Header[],
		inputsToSign: number[]
	) {
		const sigmaRust = wasmModule.SigmaRust;
		const wallet = this.buildWallet(this._from, this._deriver);
		const blockHeaders = sigmaRust.BlockHeaders.from_json(
			headers.map((x) => {
				return {
					...x,
					id: x.headerId,
					timestamp: toBigNumber(x.timestamp).toNumber(),
					nBits: toBigNumber(x.nBits).toNumber(),
					votes: Buffer.from(x.votes).toString('hex')
				};
			})
		);

		const preHeader = sigmaRust.PreHeader.from_block_header(
			blockHeaders.get(0)
		);
		const signContext = new sigmaRust.ErgoStateContext(
			preHeader,
			blockHeaders
		);
		const signed: SignedInput[] = [];

		for (const index of inputsToSign) {
			const result = wallet.sign_tx_input(
				index,
				signContext,
				unsigned,
				unspentBoxes,
				dataInputBoxes
			);

			signed.push({
				boxId: result.box_id().to_str(),
				spendingProof: JSON.parse(result.spending_proof().to_json())
			});
		}

		return signed;
	}

	private buildWallet(addresses: StateAddress[], bip32: Bip32): Wallet {
		const sigmaRust = wasmModule.SigmaRust;
		const sks = new sigmaRust.SecretKeys();

		for (const address of addresses) {
			sks.add(
				sigmaRust.SecretKey.dlog_from_bytes(
					bip32.derivePrivateKey(address.index)
				)
			);
		}
		return sigmaRust.Wallet.from_secrets(sks);
	}
}
