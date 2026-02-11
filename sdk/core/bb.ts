import "./polyfills";

export type BbModule = typeof import("@aztec/bb.js");

let bbModulePromise: Promise<BbModule> | null = null;

export async function loadBb(): Promise<BbModule> {
  if (!bbModulePromise) {
    bbModulePromise = import("@aztec/bb.js");
  }

  return bbModulePromise;
}
