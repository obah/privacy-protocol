import "./polyfills";

export interface BbFr {
  toString(): string;
  toBuffer(): Uint8Array;
}

export interface BbFrClass {
  new (value: bigint): BbFr;
  fromString(value: string): BbFr;
  random(): BbFr;
}

export interface BbBarretenberg {
  poseidon2Hash(values: BbFr[]): Promise<BbFr>;
}

export interface BbUltraHonkBackend {
  generateProof(
    witness: Uint8Array,
    options?: { keccak?: boolean },
  ): Promise<{ proof: Uint8Array; publicInputs: unknown[] }>;
}

export interface BbUltraHonkBackendClass {
  new (bytecode: unknown, options: { threads: number }): BbUltraHonkBackend;
}

export interface BbModule {
  Fr: BbFrClass;
  Barretenberg: {
    new: () => Promise<BbBarretenberg>;
  };
  UltraHonkBackend: BbUltraHonkBackendClass;
}

let bbModulePromise: Promise<BbModule> | null = null;

export async function loadBb(): Promise<BbModule> {
  if (!bbModulePromise) {
    bbModulePromise = import("@aztec/bb.js") as Promise<BbModule>;
  }

  return bbModulePromise;
}
