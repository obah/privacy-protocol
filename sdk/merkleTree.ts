import { Barretenberg, Fr } from "@aztec/bb.js";

let bbInstance: Barretenberg | undefined;

async function getBb(): Promise<Barretenberg> {
  if (!bbInstance) {
    bbInstance = await Barretenberg.new();
  }
  return bbInstance;
}

async function hashLeftRight(
  left: string | Fr,
  right: string | Fr,
): Promise<string> {
  const bb = await getBb();
  const frLeft = typeof left === "string" ? Fr.fromString(left) : left;
  const frRight = typeof right === "string" ? Fr.fromString(right) : right;
  const hash = await bb.poseidon2Hash([frLeft, frRight]);
  return hash.toString();
}

export interface MerkleProof {
  root: string;
  pathElements: string[];
  pathIndices: number[];
  leaf: string;
}

export class PoseidonTree {
  levels: number;
  zeros: string[];
  storage: Map<string, string>;
  totalLeaves: number;

  constructor(levels: number, zeros: string[]) {
    if (zeros.length < levels + 1) {
      throw new Error(
        "Not enough zero values provided for the given tree height.",
      );
    }
    this.levels = levels;
    this.storage = new Map();
    this.zeros = zeros;
    this.totalLeaves = 0;
  }

  async init(defaultLeaves: string[] = []) {
    if (defaultLeaves.length > 0) {
      this.totalLeaves = defaultLeaves.length;

      defaultLeaves.forEach((leaf, index) => {
        this.storage.set(PoseidonTree.indexToKey(0, index), leaf);
      });

      for (let level = 1; level <= this.levels; level++) {
        const numNodes = Math.ceil(this.totalLeaves / 2 ** level);
        for (let i = 0; i < numNodes; i++) {
          const left =
            this.storage.get(PoseidonTree.indexToKey(level - 1, 2 * i)) ||
            this.zeros[level - 1];
          const right =
            this.storage.get(PoseidonTree.indexToKey(level - 1, 2 * i + 1)) ||
            this.zeros[level - 1];
          const node = await hashLeftRight(left, right);
          this.storage.set(PoseidonTree.indexToKey(level, i), node);
        }
      }
    }
  }

  static indexToKey(level: number, index: number): string {
    return `${level}-${index}`;
  }

  getIndex(leaf: string): number {
    for (const [key, value] of this.storage.entries()) {
      if (value === leaf && key.startsWith("0-")) {
        return parseInt(key.split("-")[1]);
      }
    }
    return -1;
  }

  root(): string {
    return (
      this.storage.get(PoseidonTree.indexToKey(this.levels, 0)) ||
      this.zeros[this.levels]
    );
  }

  proof(index: number): MerkleProof {
    const leaf = this.storage.get(PoseidonTree.indexToKey(0, index));
    if (!leaf) throw new Error("leaf not found");

    const pathElements: string[] = [];
    const pathIndices: number[] = [];

    this.traverse(index, (level, currentIndex, siblingIndex) => {
      const sibling =
        this.storage.get(PoseidonTree.indexToKey(level, siblingIndex)) ||
        this.zeros[level];
      pathElements.push(sibling);
      pathIndices.push(currentIndex % 2);
    });

    return {
      root: this.root(),
      pathElements,
      pathIndices,
      leaf,
    };
  }

  async insert(leaf: string) {
    const index = this.totalLeaves;
    await this.update(index, leaf, true);
    this.totalLeaves++;
  }

  async update(index: number, newLeaf: string, isInsert: boolean = false) {
    if (!isInsert && index >= this.totalLeaves) {
      throw Error("Use insert method for new elements.");
    } else if (isInsert && index < this.totalLeaves) {
      throw Error("Use update method for existing elements.");
    }

    const keyValueToStore: { key: string; value: string }[] = [];
    let currentElement = newLeaf;

    await this.traverseAsync(
      index,
      async (level, currentIndex, siblingIndex) => {
        const sibling =
          this.storage.get(PoseidonTree.indexToKey(level, siblingIndex)) ||
          this.zeros[level];
        const [left, right] =
          currentIndex % 2 === 0
            ? [currentElement, sibling]
            : [sibling, currentElement];
        keyValueToStore.push({
          key: PoseidonTree.indexToKey(level, currentIndex),
          value: currentElement,
        });
        currentElement = await hashLeftRight(left, right);
      },
    );

    keyValueToStore.push({
      key: PoseidonTree.indexToKey(this.levels, 0),
      value: currentElement,
    });
    keyValueToStore.forEach(({ key, value }) => this.storage.set(key, value));
  }

  traverse(
    index: number,
    fn: (level: number, currentIndex: number, siblingIndex: number) => void,
  ) {
    let currentIndex = index;
    for (let level = 0; level < this.levels; level++) {
      const siblingIndex =
        currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      fn(level, currentIndex, siblingIndex);
      currentIndex = Math.floor(currentIndex / 2);
    }
  }

  async traverseAsync(
    index: number,
    fn: (
      level: number,
      currentIndex: number,
      siblingIndex: number,
    ) => Promise<void>,
  ) {
    let currentIndex = index;
    for (let level = 0; level < this.levels; level++) {
      const siblingIndex =
        currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      await fn(level, currentIndex, siblingIndex);
      currentIndex = Math.floor(currentIndex / 2);
    }
  }
}

const ZERO_VALUES = [
  // depth 0
  "0x16faccf02fa3d2e580fcf2d254903138cf8c67a463a5849d8f8558ac454d59ad",
  // depth 1
  "0x0b4cd30ce16c6f106a2dc36ffd4dcf2ab127e8271d1085ca35f82356ba400b9e",
  // depth 2
  "0x0210b61500422a6c30eb81faee1337f296cfbb55821519d1dd370d05fa2c69ea",
  // depth 3
  "0x0c25ac91b7b4d342d482d43b18587a3581bc55d86313d7d0dc1e8f66158db821",
  // depth 4
  "0x21f1d72137cc0ba7f04715660c1f459316c1b29b2265f5b85e2fba15318a961a",
  // depth 5
  "0x2bcb799266aadc8bc1d42cd477146428e1dcbb5c3ebe92bd7bcd9e35617e5fce",
  // depth 6
  "0x27cad244cc7971526337d84060ce1d5463b892ba1d9a8d936ba765c746a8bfc7",
  // depth 7
  "0x0e98be9b2df3f160c565fc172ab4d6727406349a0e80ebe48fefff331546f9de",
  // depth 8
  "0x17b4a631cbc0e641ade21bd54f6ee5d42672c77ca84aa4089fa8579fb60375dd",
  // depth 9
  "0x00d746e017b1c8f1418d9ecc50ad90a667462a55278b7982ec770c8ebd793703",
  // depth 10
  "0x2df7ab46f3268c2a5080be711335318bd392ed378624d1c8f41686311a5d3e78",
  // depth 11
  "0x1365b04501ee440beafde6075b36ceeb6b586ce3b85ac44fdb7ed92d968d67b1",
  // depth 12
  "0x2d2c94ea8d7ca11bb96ffdeaf8b7870e631c051529843fe9c7b28ffdc85fbe08",
  // depth 13
  "0x1adfc43a77280c7aabea2bcfd9379729eaa72b211227cbbb480020659886594a",
  // depth 14
  "0x036873bdf3324e5b54be89bb1d8eb2646b5f6c187cdd69166c940fe456f8586f",
  // depth 15
  "0x05a0e09f6be2c7df1cff366ab8b8b4db8fc988808c6584f3e0beead2513a02c3",
  // depth 16
  "0x06131a3c1c5087863c8da31be5185684cb83f200cd04f7d229dc243003dcc1dd",
  // depth 17
  "0x1d3245c71d673006e2edd4b7e6f39430aebb425ce583fa1811f84ae71d6808de",
  // depth 18
  "0x1e78886459c1c33286a2def6bab81afcb63f4be32d85cb4f18d4da1dd3cb8836",
  // depth 19
  "0x1738f5c4a9c5e7300f7176514502da252259123a2a6dfe7a4148e46155d2a8d2",
  // depth 20
  "0x207c726d331c3499c31fe085a5ce7f4dff27362f5344cc7b751b4b1c5b9f1cb0",
];

export async function merkleTree(leaves: string[]): Promise<PoseidonTree> {
  const TREE_HEIGHT = 20;
  const tree = new PoseidonTree(TREE_HEIGHT, ZERO_VALUES);

  await tree.init();

  for (const leaf of leaves) {
    await tree.insert(leaf);
  }

  return tree;
}
