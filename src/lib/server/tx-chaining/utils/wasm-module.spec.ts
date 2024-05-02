import { describe, it, expect } from "vitest";
import { wasmModule } from "./wasm-module";

describe("wasm module", () => {
  it("loads", async () => {
    await wasmModule.loadAsync();
    expect(wasmModule.loaded).toBe(true);
    const address = "9euvZDx78vhK5k1wBXsNvVFGc5cnoSasnXCzANpaawQveDCHLbU";
    let x = wasmModule.SigmaRust.Address.from_mainnet_str(address);
    expect(x).toBeTruthy();
  });
});
