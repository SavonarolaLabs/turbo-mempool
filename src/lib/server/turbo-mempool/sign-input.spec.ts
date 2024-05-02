import { describe, expect, it } from "vitest";
import { getProver } from "../multisig/multisig";
import { ALICE_MNEMONIC, BOB_MNEMONIC, SHADOW_MNEMONIC } from "../constants/mnemonics";
import { createWithdraw } from "./common";
import { ErgoBox, ErgoBoxes } from "ergo-lib-wasm-nodejs";
import { fakeContext } from "../multisig/fakeContext";
import * as wasm from 'ergo-lib-wasm-nodejs';
import { SHADOWPOOL_ADDRESS } from "../constants/addresses";

describe.only("sign_tx_input", ()=>{
    it("works", async()=>{
        const prover = await getProver(BOB_MNEMONIC);

        const tx = await createWithdraw();
        // filtet  == address
        const inputBoxes = [tx.inputs[0]]
        const boxes_to_spend = ErgoBoxes.empty();
        inputBoxes.forEach((box) => {
            boxes_to_spend.add(ErgoBox.from_json(JSON.stringify(box)));
        });

//  sign_tx_input(input_idx: number, state_context: ErgoStateContext, tx: UnsignedTransaction, boxes_to_spend: ErgoBoxes, data_boxes: ErgoBoxes): Input;
        const wasmInput = prover.sign_tx_input(
            0,
            fakeContext(),
            wasm.UnsignedTransaction.from_json(JSON.stringify(tx)),
            boxes_to_spend,
            ErgoBoxes.empty()
        );
        expect(wasmInput.spending_proof()).toBe(2);
    })
})