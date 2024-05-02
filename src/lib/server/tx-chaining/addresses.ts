import { MAINNET } from "./ergo";
import { ErgoAddress, Network } from "@fleet-sdk/core";

const network = MAINNET ? Network.Mainnet : Network.Testnet;

export function addressFromPk(pk: string) {
  return ErgoAddress.fromPublicKey(pk, network).toString();
}