import { getContractBoxes } from "../../erg-contracts/box";
import { ALICE_ADDRESS, BOB_ADDRESS, DEPOSIT_ADDRESS } from "../constants/addresses";

let utxo = {}

utxo[ALICE_ADDRESS] = await getContractBoxes(ALICE_ADDRESS);
utxo[BOB_ADDRESS] = await getContractBoxes(BOB_ADDRESS);
utxo[DEPOSIT_ADDRESS] = await getContractBoxes(DEPOSIT_ADDRESS);


console.log("export const unspentUtxos = ")
console.dir(utxo, {depth:null});