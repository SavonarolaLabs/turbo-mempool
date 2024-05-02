import { beforeAll, describe, expect, it } from "vitest";
import { contractAddress } from "./address";
import { OutputBuilder, RECOMMENDED_MIN_FEE_VALUE, TransactionBuilder } from "@fleet-sdk/core";
import { ALICE_ADDRESS, BOB_ADDRESS } from "../constants/addresses";

const CHAIN_HEIGHT = 1250600;

const BOB_TREE = "0008cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c";

let tx;

describe("limit sell order", () => {
    beforeAll(() => {
        const inputs = [
            {
                boxId: "e1a20cf2048cc090f2dd97891e536def6f28e82206cdaacbf769e6b86a435c9b",
                value: "1000000000",
                ergoTree:
                    "1003040408cd0233e9a9935c8bbb8ae09b2c944c1d060492a8832252665e043b0732bdf593bf2c08cd02eb083423041003740c9e791b2fea5ecf6e273669630a25b7ecabf9145395e44798730083020873017302",
                creationHeight: 1251587,
                assets: [],
                additionalRegisters: {},
                transactionId: "bac2b1308a3c5bc04f849bdec03a902432156c27ae664a58591704a75797cec0",
                index: 0,
                confirmed: true
            }
        ];

        const outputBob = new OutputBuilder(
            BigInt("500000000") - RECOMMENDED_MIN_FEE_VALUE,
            BOB_ADDRESS
        );

        const outputAlice = new OutputBuilder(BigInt("500000000"), ALICE_ADDRESS);

        tx = new TransactionBuilder(CHAIN_HEIGHT)
            .from(inputs)
            .to([outputBob, outputAlice])
            .payFee(RECOMMENDED_MIN_FEE_VALUE)
            .build()
            .toPlainObject();
    });

    it("contract compiles", async () => {
        const expected =
            "YUgzXAHbU5PBQVZ17sAx9BM5ibamq2umSnk1hPTZ4MBEHy1BPmfWK7oD5kXiu25r6hSMFHWGuqPPXRYEd";
        expect(contractAddress).toBe(expected);
    });

    it("seller paid", () => {
        expect(tx.outputs.find((b) => b.ergoTree == BOB_TREE).value).toBe("498900000");
    });

    it("buyer paid", () => {
        expect(tx.outputs[1].value).toBe("500000000");
    });
});
