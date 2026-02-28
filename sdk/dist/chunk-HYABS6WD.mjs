import {
  __export
} from "./chunk-D57E6H3M.mjs";

// core/polyfills.ts
function assertOffset(target, offset) {
  if (!Number.isInteger(offset) || offset < 0 || offset + 8 > target.length) {
    throw new RangeError("Offset is outside buffer bounds.");
  }
}
function toUint64(value) {
  return BigInt.asUintN(64, BigInt(value));
}
function readBigUInt64BE(offset = 0) {
  assertOffset(this, offset);
  let value = 0n;
  for (let i = 0; i < 8; i += 1) {
    value = value << 8n | BigInt(this[offset + i]);
  }
  return value;
}
function readBigUInt64LE(offset = 0) {
  assertOffset(this, offset);
  let value = 0n;
  for (let i = 0; i < 8; i += 1) {
    value |= BigInt(this[offset + i]) << 8n * BigInt(i);
  }
  return value;
}
function writeBigUInt64BE(value, offset = 0) {
  assertOffset(this, offset);
  let encoded = toUint64(value);
  for (let i = 7; i >= 0; i -= 1) {
    this[offset + i] = Number(encoded & 0xffn);
    encoded >>= 8n;
  }
  return offset + 8;
}
function writeBigUInt64LE(value, offset = 0) {
  assertOffset(this, offset);
  let encoded = toUint64(value);
  for (let i = 0; i < 8; i += 1) {
    this[offset + i] = Number(encoded & 0xffn);
    encoded >>= 8n;
  }
  return offset + 8;
}
function defineBufferMethod(bufferPrototype, name, implementation) {
  if (typeof bufferPrototype[name] === "function") {
    return;
  }
  Object.defineProperty(bufferPrototype, name, {
    value: implementation,
    writable: true,
    configurable: true
  });
}
function installBufferBigIntPolyfill() {
  defineBufferMethod(
    Uint8Array.prototype,
    "readBigUInt64BE",
    readBigUInt64BE
  );
  defineBufferMethod(
    Uint8Array.prototype,
    "readBigUInt64LE",
    readBigUInt64LE
  );
  defineBufferMethod(
    Uint8Array.prototype,
    "readBigUint64BE",
    readBigUInt64BE
  );
  defineBufferMethod(
    Uint8Array.prototype,
    "readBigUint64LE",
    readBigUInt64LE
  );
  defineBufferMethod(
    Uint8Array.prototype,
    "writeBigUInt64BE",
    writeBigUInt64BE
  );
  defineBufferMethod(
    Uint8Array.prototype,
    "writeBigUInt64LE",
    writeBigUInt64LE
  );
  defineBufferMethod(
    Uint8Array.prototype,
    "writeBigUint64BE",
    writeBigUInt64BE
  );
  defineBufferMethod(
    Uint8Array.prototype,
    "writeBigUint64LE",
    writeBigUInt64LE
  );
  const globalObject = globalThis;
  const bufferPrototype = globalObject.Buffer?.prototype;
  if (!bufferPrototype) {
    return;
  }
  defineBufferMethod(bufferPrototype, "readBigUInt64BE", readBigUInt64BE);
  defineBufferMethod(bufferPrototype, "readBigUInt64LE", readBigUInt64LE);
  defineBufferMethod(bufferPrototype, "readBigUint64BE", readBigUInt64BE);
  defineBufferMethod(bufferPrototype, "readBigUint64LE", readBigUInt64LE);
  defineBufferMethod(bufferPrototype, "writeBigUInt64BE", writeBigUInt64BE);
  defineBufferMethod(bufferPrototype, "writeBigUInt64LE", writeBigUInt64LE);
  defineBufferMethod(bufferPrototype, "writeBigUint64BE", writeBigUInt64BE);
  defineBufferMethod(bufferPrototype, "writeBigUint64LE", writeBigUInt64LE);
}
installBufferBigIntPolyfill();

// core/bb.ts
var bbModulePromise = null;
async function loadBb() {
  if (!bbModulePromise) {
    bbModulePromise = import("./browser-OLXD6FMT.mjs");
  }
  return bbModulePromise;
}

// core/merkleTree.ts
var bbInstance;
var frClass;
async function getFrClass() {
  if (!frClass) {
    const bbModule = await loadBb();
    frClass = bbModule.Fr;
  }
  return frClass;
}
async function getBb() {
  if (!bbInstance) {
    const bbModule = await loadBb();
    const BarretenbergCtor = bbModule.Barretenberg;
    bbInstance = await BarretenbergCtor.new();
  }
  if (!bbInstance) {
    throw new Error("Failed to initialize Barretenberg");
  }
  return bbInstance;
}
async function toFr(value) {
  if (typeof value !== "string") {
    return value;
  }
  const FrCtor = await getFrClass();
  return FrCtor.fromString(value);
}
async function hashLeftRight(left, right) {
  const bb = await getBb();
  const frLeft = await toFr(left);
  const frRight = await toFr(right);
  const hash = await bb.poseidon2Hash([frLeft, frRight]);
  return hash.toString();
}
var PoseidonTree = class _PoseidonTree {
  constructor(levels, zeros) {
    if (zeros.length < levels + 1) {
      throw new Error(
        "Not enough zero values provided for the given tree height."
      );
    }
    this.levels = levels;
    this.storage = /* @__PURE__ */ new Map();
    this.zeros = zeros;
    this.totalLeaves = 0;
  }
  async init(defaultLeaves = []) {
    if (defaultLeaves.length > 0) {
      this.totalLeaves = defaultLeaves.length;
      defaultLeaves.forEach((leaf, index) => {
        this.storage.set(_PoseidonTree.indexToKey(0, index), leaf);
      });
      for (let level = 1; level <= this.levels; level++) {
        const numNodes = Math.ceil(this.totalLeaves / 2 ** level);
        for (let i = 0; i < numNodes; i++) {
          const left = this.storage.get(_PoseidonTree.indexToKey(level - 1, 2 * i)) || this.zeros[level - 1];
          const right = this.storage.get(_PoseidonTree.indexToKey(level - 1, 2 * i + 1)) || this.zeros[level - 1];
          const node = await hashLeftRight(left, right);
          this.storage.set(_PoseidonTree.indexToKey(level, i), node);
        }
      }
    }
  }
  static indexToKey(level, index) {
    return `${level}-${index}`;
  }
  getIndex(leaf) {
    for (const [key, value] of this.storage.entries()) {
      if (value === leaf && key.startsWith("0-")) {
        return parseInt(key.split("-")[1]);
      }
    }
    return -1;
  }
  root() {
    return this.storage.get(_PoseidonTree.indexToKey(this.levels, 0)) || this.zeros[this.levels];
  }
  proof(index) {
    const leaf = this.storage.get(_PoseidonTree.indexToKey(0, index));
    if (!leaf) throw new Error("leaf not found");
    const pathElements = [];
    const pathIndices = [];
    this.traverse(index, (level, currentIndex, siblingIndex) => {
      const sibling = this.storage.get(_PoseidonTree.indexToKey(level, siblingIndex)) || this.zeros[level];
      pathElements.push(sibling);
      pathIndices.push(currentIndex % 2);
    });
    return {
      root: this.root(),
      pathElements,
      pathIndices,
      leaf
    };
  }
  async insert(leaf) {
    const index = this.totalLeaves;
    await this.update(index, leaf, true);
    this.totalLeaves++;
  }
  async update(index, newLeaf, isInsert = false) {
    if (!isInsert && index >= this.totalLeaves) {
      throw Error("Use insert method for new elements.");
    } else if (isInsert && index < this.totalLeaves) {
      throw Error("Use update method for existing elements.");
    }
    const keyValueToStore = [];
    let currentElement = newLeaf;
    await this.traverseAsync(
      index,
      async (level, currentIndex, siblingIndex) => {
        const sibling = this.storage.get(_PoseidonTree.indexToKey(level, siblingIndex)) || this.zeros[level];
        const [left, right] = currentIndex % 2 === 0 ? [currentElement, sibling] : [sibling, currentElement];
        keyValueToStore.push({
          key: _PoseidonTree.indexToKey(level, currentIndex),
          value: currentElement
        });
        currentElement = await hashLeftRight(left, right);
      }
    );
    keyValueToStore.push({
      key: _PoseidonTree.indexToKey(this.levels, 0),
      value: currentElement
    });
    keyValueToStore.forEach(({ key, value }) => this.storage.set(key, value));
  }
  traverse(index, fn) {
    let currentIndex = index;
    for (let level = 0; level < this.levels; level++) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      fn(level, currentIndex, siblingIndex);
      currentIndex = Math.floor(currentIndex / 2);
    }
  }
  async traverseAsync(index, fn) {
    let currentIndex = index;
    for (let level = 0; level < this.levels; level++) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      await fn(level, currentIndex, siblingIndex);
      currentIndex = Math.floor(currentIndex / 2);
    }
  }
};
var ZERO_VALUES = [
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
  "0x207c726d331c3499c31fe085a5ce7f4dff27362f5344cc7b751b4b1c5b9f1cb0"
];
async function merkleTree(leaves) {
  const TREE_HEIGHT = 20;
  const tree = new PoseidonTree(TREE_HEIGHT, ZERO_VALUES);
  await tree.init();
  for (const leaf of leaves) {
    await tree.insert(leaf);
  }
  return tree;
}

// core/PrivacyProtocolSDK.ts
import { ethers } from "ethers";
import { Noir } from "@noir-lang/noir_js";

// core/circuits.json
var circuits_default = { noir_version: "1.0.0-beta.16+2d46fca7203545cbbfb31a0d0328de6c10a8db95", hash: "10333106044898452784", abi: { parameters: [{ name: "root_hash", type: { kind: "field" }, visibility: "public" }, { name: "nullifier_hash", type: { kind: "field" }, visibility: "public" }, { name: "recipient_address", type: { kind: "field" }, visibility: "public" }, { name: "data_hash", type: { kind: "field" }, visibility: "public" }, { name: "amount_to_withdraw", type: { kind: "field" }, visibility: "public" }, { name: "new_commitment", type: { kind: "field" }, visibility: "public" }, { name: "nullifier", type: { kind: "field" }, visibility: "private" }, { name: "new_nullifier", type: { kind: "field" }, visibility: "private" }, { name: "secret", type: { kind: "field" }, visibility: "private" }, { name: "amount_in_pool", type: { kind: "field" }, visibility: "private" }, { name: "amount_left", type: { kind: "field" }, visibility: "private" }, { name: "merkle_proof", type: { kind: "array", length: 20, type: { kind: "field" } }, visibility: "private" }, { name: "is_even", type: { kind: "array", length: 20, type: { kind: "boolean" } }, visibility: "private" }], return_type: null, error_types: { "1493345259169062951": { error_kind: "string", string: "Invalid new commitment" }, "6298344636856496564": { error_kind: "string", string: "Invalid amounts" }, "10903322481741506051": { error_kind: "string", string: "Invalid nullifier hash" }, "12469291177396340830": { error_kind: "string", string: "call to assert_max_bit_size" }, "15183641815212410238": { error_kind: "string", string: "Invalid merkle proof" } } }, bytecode: "H4sIAAAAAAAA/71cV5QURRS9zS6S85LTLjlnJaigBCUoLCpBCUpQQF0yKqDAKkEEVEAFVIISFBABJUpWUTCDCTOIAZUPf/z3FVvYxZxqt2/TXXPOPW+3pt+be1+9u2dnprs95D3SdcwZNmbseYlP6N89QZqONXU01zIta1mWtVqWtdqWtTqWtbqWtXqWtfqWtQaWtYaWtUaWtcaWtSaWtaaWtWaWteaWtRaWtZaWtVaWtSKCh1LW0i1rRfWa+UjTMVPHFiN7TzzTck3DPdndduXmDhzSoPW57lP3jl/c5cw/S//WdTMR6uEVIeoWDV/30hch+bdGvq+TZtYuDt8T6vcrdCwMv/eernvxuDaCKwVXCdpeJt92cNOX9sj3dTzzh6C+tEuJ7Y3jOgiuFlwjuDaleAGSr4fwc9gBbnrYEfm+TgGzdmoPC+BSv17sYUfjuE6C6wTXCzobuQzPYvD/hjN5R8H1MbV+focrTm0i8HoP0fY3PeV18uNXjODUhahL9NVzpbUNwmvtimgzFOe+2vzURceuCPZTN8ENghsF3Y1cEDyLw///h8l7H8n6KVPrY3kdg5sZK47wnHoQdYm+eq60dkN4rT0RbYbi3Febn3ro2BPBfuoluElws6C3kQuCZwn47x2YvONI1k9ZWh/L6wO4mbESBKc+RF2ir54rrb0QXms2os1QnPtq81MfHbMR7Ke+glsEtwpuM3JB8CwJ/303k/chkvVTLa2P5fUR3MxYSYJTP6Iu0VfPlda+CK+1P6LNUJz7avNTPx37I9hPAwQDBbcL7jByQfAsBf8zKybvYyTrp9paH8vrE7iZsVIEp0FEXaKvniutAxBe62BEm6E499Xmp0E6Dkawn4YIhgruFNxl5ILgWRr+571M3qdI1k91tD6W12dwM2OlCU7DiLpEXz1XWocgvNbhiDZDce6rzU/DdByOYD+NEIwU3C24x8gFwbMM/O9KmLwTSNZPdbU+ltdJuJmxMgSnUURdoq+eK60jEF7raESboTj31eanUTqORrCfxgjuFdwnuN/IBcGzLPzvGZm8z5Gsn+ppfSyvL+BmxsoSnHKIukRfPVdaxyC81rGINkNx7qvNTzk6jkWwn8YJxgsmCCYauSB4loP/HT2T9yWS9VN9rY/l9RXczFg5gtMkoi7RV8+V1nEIr3Uyos1QnPtq89MkHScj2E9TBA8IHoR/bgY7fxnwz29h8r5Gsn5qoPWxvE7BzYxlEJymEnWJvnqutE5BeK3TEG2G4txXm5+m6jgNwX6aLnhY8IhghpELgmd5+OeGMXnfIFk/NdT6WF7fws2MlSc4zSTqEn31XGmdjvBaZyHaDMW5rzY/zdRxFoL9lCt4VPCYYLaRC4JnBfjnVTJ53yFZPzXS+lhe38PNjFUgOM0h6hJ99VxpzUV4rXMRbYbi3Febn+boOBfBfponeFwwH5eeWw2CZ0X45yQzeT8gWT811vpYXj/CzYxVJDgtIOoSffVcaZ2H8FoXItoMxbmvNj8t0HEhgv20SPCk4CnB00YuCJ6V4J/Pz+T9hGT91ETrY3mdhpsZq0RwWkzUJfrqnYYbrYsQXusSRJuhOPfV5qfFOi5BsJ+WCp4RPCt4zsgFwbMy/GthmLwzSNZPTbU+ltfPcDNjlQlOy4i6RF89V1qXIrzW5Yg2Q3Huq81Py3RcjmA/rRA8L3hB8KKRC4JnFfjXkTF5Z5Gsn5ppfSyvX+BmxqoQnFYSdYm+eq60rkB4rasQbYbi3Febn1bquArBflotWCN4SfCykQuCZ1X412Ayeb8iWT811/pYXr/BzYxVJTitJeoSffVcaV2N8FrXIdoMxbmvNj+t1XEdgv20XrBB8IrgVSMXBM9q6pgIeb8jWT+10PpYXufgZsaqEZw2EnWJvnqutK5HeK2bEG2G4txXm5826rgJwX7aLHhNsEXwupELgmd1+Nf+M3l/IFk/tdT6WF5/ws2MVSc4bSXqEn31XGndjPBatyHaDMW5rzY/bdVxG4L9tF3whuBNwQ4jFwTPGvDvm8Hk/YVk/dRK62N5nYebGatBcNpJ1CX66rnSuh3hte5CtBmKc19tftqp4y4E+2m3YI9gr+CtlJrsPTjMY/OjuxvR9pH1xj7k+zrpZu3UHhbS8eL9XYrquM84br/ggOCg4FBK8dT76eTz8DoRx+5H+D4cxuXN0mEdD+h4UMdDxnFHBG8L3hG8m1KTnaWCCN+HI+GPvfA5tHqo+9OovVX7qu7Zo/ZV3c9D6VbXTatrPdX1aaWRd/2EOndZnW+pzhFT57Wo7+LV94fqOw/1Oa36bEm9H1b/w6v/O9TfypqaVxbyrrdV1+PVQd61GOpcbXV+qTonTp3Ho849UN+XNtEc1Wdp6v2/es+i/s9qpTn/Jxp5PVXzpfpf0HiukPFzho5DC68+0PlksS3GUxd0BD1X4X+eq6jjjgknDpdrO3qA+Vx1HdM27BtRaHj2MvO52TrOODrr1LGs3SfN5+brWD/z+NkVOXszkPL4F727DHaQTAAA", debug_symbols: "tdjBbuIwEAbgd8mZg2dsj8f7KqtVldK0QooApVBpVfXd12H/SeGQKIrV0wyE+ezGE5vy2bx0z9e3p8Px9fTe/Pr92TwPh74/vD31p317OZyO5d3Pr11jL58uQ9eVt5q766Xq3A7d8dL8Ol77ftd8tP319qH3c3u8xUs7lKtu13THlxIL+HrouzH72n1Xu/nS6COKo+SpPNJDPS3UJ496oe/hSVePr8HqmefG9z83vvhk9aJz48efGz85RX0Kbm78pflnV1WfMqFefZyrz/P1PjLqfU5TvTz2Hy1MwDtvMyhp3kQQWRN5ijxL8DwRlOw5CHpHUF4/CxFrBS+JNv0hwjoRd8spqx9nTdmWM88/zlK7nqn+NiwR+bslssy3RK5fz8VZTI9WSXXDYmSye5mj3/BskmObAbk4u5zsK5eTQ/VyLhLrlpOlejmXZ1G7nOSy3Qoimd1seWm3TNNy6N1px6uBMLVU4LQFiCJ23qvOAZ4rO8r76o5aJNZ1lI/VHbU8i+qOounbA7GTLVsE6yT4MLtF+NoTPNSf4KH+BA/1J3ioP8FXExo3EeuaO8jP3ov65i7fZqw1g3s8//6UV+3+MDz8N9SwK3vXrmEqUyuBy2gl+PJdpoQwiiVGRCmfLaNzQlTEXGJB/GiV090TIo8rUqJHDIgRURAToiLm/zE4REKEF+AFeAFegBfgBXgBXoQX4UV4EV6EF+FFeBFehBfhCTyBJ/AEnsATeAJP4Ak8gZfgJXgJXoKX4CV4CV6Cl+AleApP4Sk8hafwFJ7CU3gKT+FleBlehpfhZXgZXoaX4WV4GR45ZwlZwpZ4S4Il0RKxJFmilphMJpPJZDKZTCaTyWQymUwmk8lsMpvMJrPJbDKbzCazyWwym+xN9ibfHiAdkyIHPybBkiKHNCZiSZFvp9FHOxza577Drx2v1+P+7sePy9+zXbGfR87Dad+9XIdu3Bpu18pm8Q8=", file_map: { "18": { source: 'pub mod bn254;\nuse crate::{runtime::is_unconstrained, static_assert};\nuse bn254::lt as bn254_lt;\n\nimpl Field {\n    /// Asserts that `self` can be represented in `bit_size` bits.\n    ///\n    /// # Failures\n    /// Causes a constraint failure for `Field` values exceeding `2^{bit_size}`.\n    // docs:start:assert_max_bit_size\n    pub fn assert_max_bit_size<let BIT_SIZE: u32>(self) {\n        // docs:end:assert_max_bit_size\n        static_assert(\n            BIT_SIZE < modulus_num_bits() as u32,\n            "BIT_SIZE must be less than modulus_num_bits",\n        );\n        __assert_max_bit_size(self, BIT_SIZE);\n    }\n\n    /// Decomposes `self` into its little endian bit decomposition as a `[u1; N]` array.\n    /// This slice will be zero padded should not all bits be necessary to represent `self`.\n    ///\n    /// # Failures\n    /// Causes a constraint failure for `Field` values exceeding `2^N` as the resulting slice will not\n    /// be able to represent the original `Field`.\n    ///\n    /// # Safety\n    /// The bit decomposition returned is canonical and is guaranteed to not overflow the modulus.\n    // docs:start:to_le_bits\n    pub fn to_le_bits<let N: u32>(self: Self) -> [u1; N] {\n        // docs:end:to_le_bits\n        let bits = __to_le_bits(self);\n\n        if !is_unconstrained() {\n            // Ensure that the byte decomposition does not overflow the modulus\n            let p = modulus_le_bits();\n            assert(bits.len() <= p.len());\n            let mut ok = bits.len() != p.len();\n            for i in 0..N {\n                if !ok {\n                    if (bits[N - 1 - i] != p[N - 1 - i]) {\n                        assert(p[N - 1 - i] == 1);\n                        ok = true;\n                    }\n                }\n            }\n            assert(ok);\n        }\n        bits\n    }\n\n    /// Decomposes `self` into its big endian bit decomposition as a `[u1; N]` array.\n    /// This array will be zero padded should not all bits be necessary to represent `self`.\n    ///\n    /// # Failures\n    /// Causes a constraint failure for `Field` values exceeding `2^N` as the resulting slice will not\n    /// be able to represent the original `Field`.\n    ///\n    /// # Safety\n    /// The bit decomposition returned is canonical and is guaranteed to not overflow the modulus.\n    // docs:start:to_be_bits\n    pub fn to_be_bits<let N: u32>(self: Self) -> [u1; N] {\n        // docs:end:to_be_bits\n        let bits = __to_be_bits(self);\n\n        if !is_unconstrained() {\n            // Ensure that the decomposition does not overflow the modulus\n            let p = modulus_be_bits();\n            assert(bits.len() <= p.len());\n            let mut ok = bits.len() != p.len();\n            for i in 0..N {\n                if !ok {\n                    if (bits[i] != p[i]) {\n                        assert(p[i] == 1);\n                        ok = true;\n                    }\n                }\n            }\n            assert(ok);\n        }\n        bits\n    }\n\n    /// Decomposes `self` into its little endian byte decomposition as a `[u8;N]` array\n    /// This array will be zero padded should not all bytes be necessary to represent `self`.\n    ///\n    /// # Failures\n    ///  The length N of the array must be big enough to contain all the bytes of the \'self\',\n    ///  and no more than the number of bytes required to represent the field modulus\n    ///\n    /// # Safety\n    /// The result is ensured to be the canonical decomposition of the field element\n    // docs:start:to_le_bytes\n    pub fn to_le_bytes<let N: u32>(self: Self) -> [u8; N] {\n        // docs:end:to_le_bytes\n        static_assert(\n            N <= modulus_le_bytes().len(),\n            "N must be less than or equal to modulus_le_bytes().len()",\n        );\n        // Compute the byte decomposition\n        let bytes = self.to_le_radix(256);\n\n        if !is_unconstrained() {\n            // Ensure that the byte decomposition does not overflow the modulus\n            let p = modulus_le_bytes();\n            assert(bytes.len() <= p.len());\n            let mut ok = bytes.len() != p.len();\n            for i in 0..N {\n                if !ok {\n                    if (bytes[N - 1 - i] != p[N - 1 - i]) {\n                        assert(bytes[N - 1 - i] < p[N - 1 - i]);\n                        ok = true;\n                    }\n                }\n            }\n            assert(ok);\n        }\n        bytes\n    }\n\n    /// Decomposes `self` into its big endian byte decomposition as a `[u8;N]` array of length required to represent the field modulus\n    /// This array will be zero padded should not all bytes be necessary to represent `self`.\n    ///\n    /// # Failures\n    ///  The length N of the array must be big enough to contain all the bytes of the \'self\',\n    ///  and no more than the number of bytes required to represent the field modulus\n    ///\n    /// # Safety\n    /// The result is ensured to be the canonical decomposition of the field element\n    // docs:start:to_be_bytes\n    pub fn to_be_bytes<let N: u32>(self: Self) -> [u8; N] {\n        // docs:end:to_be_bytes\n        static_assert(\n            N <= modulus_le_bytes().len(),\n            "N must be less than or equal to modulus_le_bytes().len()",\n        );\n        // Compute the byte decomposition\n        let bytes = self.to_be_radix(256);\n\n        if !is_unconstrained() {\n            // Ensure that the byte decomposition does not overflow the modulus\n            let p = modulus_be_bytes();\n            assert(bytes.len() <= p.len());\n            let mut ok = bytes.len() != p.len();\n            for i in 0..N {\n                if !ok {\n                    if (bytes[i] != p[i]) {\n                        assert(bytes[i] < p[i]);\n                        ok = true;\n                    }\n                }\n            }\n            assert(ok);\n        }\n        bytes\n    }\n\n    fn to_le_radix<let N: u32>(self: Self, radix: u32) -> [u8; N] {\n        // Brillig does not need an immediate radix\n        if !crate::runtime::is_unconstrained() {\n            static_assert(1 < radix, "radix must be greater than 1");\n            static_assert(radix <= 256, "radix must be less than or equal to 256");\n            static_assert(radix & (radix - 1) == 0, "radix must be a power of 2");\n        }\n        __to_le_radix(self, radix)\n    }\n\n    fn to_be_radix<let N: u32>(self: Self, radix: u32) -> [u8; N] {\n        // Brillig does not need an immediate radix\n        if !crate::runtime::is_unconstrained() {\n            static_assert(1 < radix, "radix must be greater than 1");\n            static_assert(radix <= 256, "radix must be less than or equal to 256");\n            static_assert(radix & (radix - 1) == 0, "radix must be a power of 2");\n        }\n        __to_be_radix(self, radix)\n    }\n\n    // Returns self to the power of the given exponent value.\n    // Caution: we assume the exponent fits into 32 bits\n    // using a bigger bit size impacts negatively the performance and should be done only if the exponent does not fit in 32 bits\n    pub fn pow_32(self, exponent: Field) -> Field {\n        let mut r: Field = 1;\n        let b: [u1; 32] = exponent.to_le_bits();\n\n        for i in 1..33 {\n            r *= r;\n            r = (b[32 - i] as Field) * (r * self) + (1 - b[32 - i] as Field) * r;\n        }\n        r\n    }\n\n    // Parity of (prime) Field element, i.e. sgn0(x mod p) = 0 if x `elem` {0, ..., p-1} is even, otherwise sgn0(x mod p) = 1.\n    pub fn sgn0(self) -> u1 {\n        self as u1\n    }\n\n    pub fn lt(self, another: Field) -> bool {\n        if crate::compat::is_bn254() {\n            bn254_lt(self, another)\n        } else {\n            lt_fallback(self, another)\n        }\n    }\n\n    /// Convert a little endian byte array to a field element.\n    /// If the provided byte array overflows the field modulus then the Field will silently wrap around.\n    pub fn from_le_bytes<let N: u32>(bytes: [u8; N]) -> Field {\n        static_assert(\n            N <= modulus_le_bytes().len(),\n            "N must be less than or equal to modulus_le_bytes().len()",\n        );\n        let mut v = 1;\n        let mut result = 0;\n\n        for i in 0..N {\n            result += (bytes[i] as Field) * v;\n            v = v * 256;\n        }\n        result\n    }\n\n    /// Convert a big endian byte array to a field element.\n    /// If the provided byte array overflows the field modulus then the Field will silently wrap around.\n    pub fn from_be_bytes<let N: u32>(bytes: [u8; N]) -> Field {\n        let mut v = 1;\n        let mut result = 0;\n\n        for i in 0..N {\n            result += (bytes[N - 1 - i] as Field) * v;\n            v = v * 256;\n        }\n        result\n    }\n}\n\n#[builtin(apply_range_constraint)]\nfn __assert_max_bit_size(value: Field, bit_size: u32) {}\n\n// `_radix` must be less than 256\n#[builtin(to_le_radix)]\nfn __to_le_radix<let N: u32>(value: Field, radix: u32) -> [u8; N] {}\n\n// `_radix` must be less than 256\n#[builtin(to_be_radix)]\nfn __to_be_radix<let N: u32>(value: Field, radix: u32) -> [u8; N] {}\n\n/// Decomposes `self` into its little endian bit decomposition as a `[u1; N]` array.\n/// This slice will be zero padded should not all bits be necessary to represent `self`.\n///\n/// # Failures\n/// Causes a constraint failure for `Field` values exceeding `2^N` as the resulting slice will not\n/// be able to represent the original `Field`.\n///\n/// # Safety\n/// Values of `N` equal to or greater than the number of bits necessary to represent the `Field` modulus\n/// (e.g. 254 for the BN254 field) allow for multiple bit decompositions. This is due to how the `Field` will\n/// wrap around due to overflow when verifying the decomposition.\n#[builtin(to_le_bits)]\nfn __to_le_bits<let N: u32>(value: Field) -> [u1; N] {}\n\n/// Decomposes `self` into its big endian bit decomposition as a `[u1; N]` array.\n/// This array will be zero padded should not all bits be necessary to represent `self`.\n///\n/// # Failures\n/// Causes a constraint failure for `Field` values exceeding `2^N` as the resulting slice will not\n/// be able to represent the original `Field`.\n///\n/// # Safety\n/// Values of `N` equal to or greater than the number of bits necessary to represent the `Field` modulus\n/// (e.g. 254 for the BN254 field) allow for multiple bit decompositions. This is due to how the `Field` will\n/// wrap around due to overflow when verifying the decomposition.\n#[builtin(to_be_bits)]\nfn __to_be_bits<let N: u32>(value: Field) -> [u1; N] {}\n\n#[builtin(modulus_num_bits)]\npub comptime fn modulus_num_bits() -> u64 {}\n\n#[builtin(modulus_be_bits)]\npub comptime fn modulus_be_bits() -> [u1] {}\n\n#[builtin(modulus_le_bits)]\npub comptime fn modulus_le_bits() -> [u1] {}\n\n#[builtin(modulus_be_bytes)]\npub comptime fn modulus_be_bytes() -> [u8] {}\n\n#[builtin(modulus_le_bytes)]\npub comptime fn modulus_le_bytes() -> [u8] {}\n\n/// An unconstrained only built in to efficiently compare fields.\n#[builtin(field_less_than)]\nunconstrained fn __field_less_than(x: Field, y: Field) -> bool {}\n\npub(crate) unconstrained fn field_less_than(x: Field, y: Field) -> bool {\n    __field_less_than(x, y)\n}\n\n// Convert a 32 byte array to a field element by modding\npub fn bytes32_to_field(bytes32: [u8; 32]) -> Field {\n    // Convert it to a field element\n    let mut v = 1;\n    let mut high = 0 as Field;\n    let mut low = 0 as Field;\n\n    for i in 0..16 {\n        high = high + (bytes32[15 - i] as Field) * v;\n        low = low + (bytes32[16 + 15 - i] as Field) * v;\n        v = v * 256;\n    }\n    // Abuse that a % p + b % p = (a + b) % p and that low < p\n    low + high * v\n}\n\nfn lt_fallback(x: Field, y: Field) -> bool {\n    if is_unconstrained() {\n        // Safety: unconstrained context\n        unsafe {\n            field_less_than(x, y)\n        }\n    } else {\n        let x_bytes: [u8; 32] = x.to_le_bytes();\n        let y_bytes: [u8; 32] = y.to_le_bytes();\n        let mut x_is_lt = false;\n        let mut done = false;\n        for i in 0..32 {\n            if (!done) {\n                let x_byte = x_bytes[32 - 1 - i] as u8;\n                let y_byte = y_bytes[32 - 1 - i] as u8;\n                let bytes_match = x_byte == y_byte;\n                if !bytes_match {\n                    x_is_lt = x_byte < y_byte;\n                    done = true;\n                }\n            }\n        }\n        x_is_lt\n    }\n}\n\nmod tests {\n    use crate::{panic::panic, runtime, static_assert};\n    use super::{\n        field_less_than, modulus_be_bits, modulus_be_bytes, modulus_le_bits, modulus_le_bytes,\n    };\n\n    #[test]\n    // docs:start:to_be_bits_example\n    fn test_to_be_bits() {\n        let field = 2;\n        let bits: [u1; 8] = field.to_be_bits();\n        assert_eq(bits, [0, 0, 0, 0, 0, 0, 1, 0]);\n    }\n    // docs:end:to_be_bits_example\n\n    #[test]\n    // docs:start:to_le_bits_example\n    fn test_to_le_bits() {\n        let field = 2;\n        let bits: [u1; 8] = field.to_le_bits();\n        assert_eq(bits, [0, 1, 0, 0, 0, 0, 0, 0]);\n    }\n    // docs:end:to_le_bits_example\n\n    #[test]\n    // docs:start:to_be_bytes_example\n    fn test_to_be_bytes() {\n        let field = 2;\n        let bytes: [u8; 8] = field.to_be_bytes();\n        assert_eq(bytes, [0, 0, 0, 0, 0, 0, 0, 2]);\n        assert_eq(Field::from_be_bytes::<8>(bytes), field);\n    }\n    // docs:end:to_be_bytes_example\n\n    #[test]\n    // docs:start:to_le_bytes_example\n    fn test_to_le_bytes() {\n        let field = 2;\n        let bytes: [u8; 8] = field.to_le_bytes();\n        assert_eq(bytes, [2, 0, 0, 0, 0, 0, 0, 0]);\n        assert_eq(Field::from_le_bytes::<8>(bytes), field);\n    }\n    // docs:end:to_le_bytes_example\n\n    #[test]\n    // docs:start:to_be_radix_example\n    fn test_to_be_radix() {\n        // 259, in base 256, big endian, is [1, 3].\n        // i.e. 3 * 256^0 + 1 * 256^1\n        let field = 259;\n\n        // The radix (in this example, 256) must be a power of 2.\n        // The length of the returned byte array can be specified to be\n        // >= the amount of space needed.\n        let bytes: [u8; 8] = field.to_be_radix(256);\n        assert_eq(bytes, [0, 0, 0, 0, 0, 0, 1, 3]);\n        assert_eq(Field::from_be_bytes::<8>(bytes), field);\n    }\n    // docs:end:to_be_radix_example\n\n    #[test]\n    // docs:start:to_le_radix_example\n    fn test_to_le_radix() {\n        // 259, in base 256, little endian, is [3, 1].\n        // i.e. 3 * 256^0 + 1 * 256^1\n        let field = 259;\n\n        // The radix (in this example, 256) must be a power of 2.\n        // The length of the returned byte array can be specified to be\n        // >= the amount of space needed.\n        let bytes: [u8; 8] = field.to_le_radix(256);\n        assert_eq(bytes, [3, 1, 0, 0, 0, 0, 0, 0]);\n        assert_eq(Field::from_le_bytes::<8>(bytes), field);\n    }\n    // docs:end:to_le_radix_example\n\n    #[test(should_fail_with = "radix must be greater than 1")]\n    fn test_to_le_radix_1() {\n        // this test should only fail in constrained mode\n        if !runtime::is_unconstrained() {\n            let field = 2;\n            let _: [u8; 8] = field.to_le_radix(1);\n        } else {\n            panic(f"radix must be greater than 1");\n        }\n    }\n\n    // Updated test to account for Brillig restriction that radix must be greater than 2\n    #[test(should_fail_with = "radix must be greater than 1")]\n    fn test_to_le_radix_brillig_1() {\n        // this test should only fail in constrained mode\n        if !runtime::is_unconstrained() {\n            let field = 1;\n            let _: [u8; 8] = field.to_le_radix(1);\n        } else {\n            panic(f"radix must be greater than 1");\n        }\n    }\n\n    #[test(should_fail_with = "radix must be a power of 2")]\n    fn test_to_le_radix_3() {\n        // this test should only fail in constrained mode\n        if !runtime::is_unconstrained() {\n            let field = 2;\n            let _: [u8; 8] = field.to_le_radix(3);\n        } else {\n            panic(f"radix must be a power of 2");\n        }\n    }\n\n    #[test]\n    fn test_to_le_radix_brillig_3() {\n        // this test should only fail in constrained mode\n        if runtime::is_unconstrained() {\n            let field = 1;\n            let out: [u8; 8] = field.to_le_radix(3);\n            let mut expected = [0; 8];\n            expected[0] = 1;\n            assert(out == expected, "unexpected result");\n        }\n    }\n\n    #[test(should_fail_with = "radix must be less than or equal to 256")]\n    fn test_to_le_radix_512() {\n        // this test should only fail in constrained mode\n        if !runtime::is_unconstrained() {\n            let field = 2;\n            let _: [u8; 8] = field.to_le_radix(512);\n        } else {\n            panic(f"radix must be less than or equal to 256")\n        }\n    }\n\n    #[test(should_fail_with = "Field failed to decompose into specified 16 limbs")]\n    unconstrained fn not_enough_limbs_brillig() {\n        let _: [u8; 16] = 0x100000000000000000000000000000000.to_le_bytes();\n    }\n\n    #[test(should_fail_with = "Field failed to decompose into specified 16 limbs")]\n    fn not_enough_limbs() {\n        let _: [u8; 16] = 0x100000000000000000000000000000000.to_le_bytes();\n    }\n\n    #[test]\n    unconstrained fn test_field_less_than() {\n        assert(field_less_than(0, 1));\n        assert(field_less_than(0, 0x100));\n        assert(field_less_than(0x100, 0 - 1));\n        assert(!field_less_than(0 - 1, 0));\n    }\n\n    #[test]\n    unconstrained fn test_large_field_values_unconstrained() {\n        let large_field = 0xffffffffffffffff;\n\n        let bits: [u1; 64] = large_field.to_le_bits();\n        assert_eq(bits[0], 1);\n\n        let bytes: [u8; 8] = large_field.to_le_bytes();\n        assert_eq(Field::from_le_bytes::<8>(bytes), large_field);\n\n        let radix_bytes: [u8; 8] = large_field.to_le_radix(256);\n        assert_eq(Field::from_le_bytes::<8>(radix_bytes), large_field);\n    }\n\n    #[test]\n    fn test_large_field_values() {\n        let large_val = 0xffffffffffffffff;\n\n        let bits: [u1; 64] = large_val.to_le_bits();\n        assert_eq(bits[0], 1);\n\n        let bytes: [u8; 8] = large_val.to_le_bytes();\n        assert_eq(Field::from_le_bytes::<8>(bytes), large_val);\n\n        let radix_bytes: [u8; 8] = large_val.to_le_radix(256);\n        assert_eq(Field::from_le_bytes::<8>(radix_bytes), large_val);\n    }\n\n    #[test]\n    fn test_decomposition_edge_cases() {\n        let zero_bits: [u1; 8] = 0.to_le_bits();\n        assert_eq(zero_bits, [0; 8]);\n\n        let zero_bytes: [u8; 8] = 0.to_le_bytes();\n        assert_eq(zero_bytes, [0; 8]);\n\n        let one_bits: [u1; 8] = 1.to_le_bits();\n        let expected: [u1; 8] = [1, 0, 0, 0, 0, 0, 0, 0];\n        assert_eq(one_bits, expected);\n\n        let pow2_bits: [u1; 8] = 4.to_le_bits();\n        let expected: [u1; 8] = [0, 0, 1, 0, 0, 0, 0, 0];\n        assert_eq(pow2_bits, expected);\n    }\n\n    #[test]\n    fn test_pow_32() {\n        assert_eq(2.pow_32(3), 8);\n        assert_eq(3.pow_32(2), 9);\n        assert_eq(5.pow_32(0), 1);\n        assert_eq(7.pow_32(1), 7);\n\n        assert_eq(2.pow_32(10), 1024);\n\n        assert_eq(0.pow_32(5), 0);\n        assert_eq(0.pow_32(0), 1);\n\n        assert_eq(1.pow_32(100), 1);\n    }\n\n    #[test]\n    fn test_sgn0() {\n        assert_eq(0.sgn0(), 0);\n        assert_eq(2.sgn0(), 0);\n        assert_eq(4.sgn0(), 0);\n        assert_eq(100.sgn0(), 0);\n\n        assert_eq(1.sgn0(), 1);\n        assert_eq(3.sgn0(), 1);\n        assert_eq(5.sgn0(), 1);\n        assert_eq(101.sgn0(), 1);\n    }\n\n    #[test(should_fail_with = "Field failed to decompose into specified 8 limbs")]\n    fn test_bit_decomposition_overflow() {\n        // 8 bits can\'t represent large field values\n        let large_val = 0x1000000000000000;\n        let _: [u1; 8] = large_val.to_le_bits();\n    }\n\n    #[test(should_fail_with = "Field failed to decompose into specified 4 limbs")]\n    fn test_byte_decomposition_overflow() {\n        // 4 bytes can\'t represent large field values\n        let large_val = 0x1000000000000000;\n        let _: [u8; 4] = large_val.to_le_bytes();\n    }\n\n    #[test]\n    fn test_to_from_be_bytes_bn254_edge_cases() {\n        if crate::compat::is_bn254() {\n            // checking that decrementing this byte produces the expected 32 BE bytes for (modulus - 1)\n            let mut p_minus_1_bytes: [u8; 32] = modulus_be_bytes().as_array();\n            assert(p_minus_1_bytes[32 - 1] > 0);\n            p_minus_1_bytes[32 - 1] -= 1;\n\n            let p_minus_1 = Field::from_be_bytes::<32>(p_minus_1_bytes);\n            assert_eq(p_minus_1 + 1, 0);\n\n            // checking that converting (modulus - 1) from and then to 32 BE bytes produces the same bytes\n            let p_minus_1_converted_bytes: [u8; 32] = p_minus_1.to_be_bytes();\n            assert_eq(p_minus_1_converted_bytes, p_minus_1_bytes);\n\n            // checking that incrementing this byte produces 32 BE bytes for (modulus + 1)\n            let mut p_plus_1_bytes: [u8; 32] = modulus_be_bytes().as_array();\n            assert(p_plus_1_bytes[32 - 1] < 255);\n            p_plus_1_bytes[32 - 1] += 1;\n\n            let p_plus_1 = Field::from_be_bytes::<32>(p_plus_1_bytes);\n            assert_eq(p_plus_1, 1);\n\n            // checking that converting p_plus_1 to 32 BE bytes produces the same\n            // byte set to 1 as p_plus_1_bytes and otherwise zeroes\n            let mut p_plus_1_converted_bytes: [u8; 32] = p_plus_1.to_be_bytes();\n            assert_eq(p_plus_1_converted_bytes[32 - 1], 1);\n            p_plus_1_converted_bytes[32 - 1] = 0;\n            assert_eq(p_plus_1_converted_bytes, [0; 32]);\n\n            // checking that Field::from_be_bytes::<32> on the Field modulus produces 0\n            assert_eq(modulus_be_bytes().len(), 32);\n            let p = Field::from_be_bytes::<32>(modulus_be_bytes().as_array());\n            assert_eq(p, 0);\n\n            // checking that converting 0 to 32 BE bytes produces 32 zeroes\n            let p_bytes: [u8; 32] = 0.to_be_bytes();\n            assert_eq(p_bytes, [0; 32]);\n        }\n    }\n\n    #[test]\n    fn test_to_from_le_bytes_bn254_edge_cases() {\n        if crate::compat::is_bn254() {\n            // checking that decrementing this byte produces the expected 32 LE bytes for (modulus - 1)\n            let mut p_minus_1_bytes: [u8; 32] = modulus_le_bytes().as_array();\n            assert(p_minus_1_bytes[0] > 0);\n            p_minus_1_bytes[0] -= 1;\n\n            let p_minus_1 = Field::from_le_bytes::<32>(p_minus_1_bytes);\n            assert_eq(p_minus_1 + 1, 0);\n\n            // checking that converting (modulus - 1) from and then to 32 BE bytes produces the same bytes\n            let p_minus_1_converted_bytes: [u8; 32] = p_minus_1.to_le_bytes();\n            assert_eq(p_minus_1_converted_bytes, p_minus_1_bytes);\n\n            // checking that incrementing this byte produces 32 LE bytes for (modulus + 1)\n            let mut p_plus_1_bytes: [u8; 32] = modulus_le_bytes().as_array();\n            assert(p_plus_1_bytes[0] < 255);\n            p_plus_1_bytes[0] += 1;\n\n            let p_plus_1 = Field::from_le_bytes::<32>(p_plus_1_bytes);\n            assert_eq(p_plus_1, 1);\n\n            // checking that converting p_plus_1 to 32 LE bytes produces the same\n            // byte set to 1 as p_plus_1_bytes and otherwise zeroes\n            let mut p_plus_1_converted_bytes: [u8; 32] = p_plus_1.to_le_bytes();\n            assert_eq(p_plus_1_converted_bytes[0], 1);\n            p_plus_1_converted_bytes[0] = 0;\n            assert_eq(p_plus_1_converted_bytes, [0; 32]);\n\n            // checking that Field::from_le_bytes::<32> on the Field modulus produces 0\n            assert_eq(modulus_le_bytes().len(), 32);\n            let p = Field::from_le_bytes::<32>(modulus_le_bytes().as_array());\n            assert_eq(p, 0);\n\n            // checking that converting 0 to 32 LE bytes produces 32 zeroes\n            let p_bytes: [u8; 32] = 0.to_le_bytes();\n            assert_eq(p_bytes, [0; 32]);\n        }\n    }\n\n    /// Convert a little endian bit array to a field element.\n    /// If the provided bit array overflows the field modulus then the Field will silently wrap around.\n    fn from_le_bits<let N: u32>(bits: [u1; N]) -> Field {\n        static_assert(\n            N <= modulus_le_bits().len(),\n            "N must be less than or equal to modulus_le_bits().len()",\n        );\n        let mut v = 1;\n        let mut result = 0;\n\n        for i in 0..N {\n            result += (bits[i] as Field) * v;\n            v = v * 2;\n        }\n        result\n    }\n\n    /// Convert a big endian bit array to a field element.\n    /// If the provided bit array overflows the field modulus then the Field will silently wrap around.\n    fn from_be_bits<let N: u32>(bits: [u1; N]) -> Field {\n        let mut v = 1;\n        let mut result = 0;\n\n        for i in 0..N {\n            result += (bits[N - 1 - i] as Field) * v;\n            v = v * 2;\n        }\n        result\n    }\n\n    #[test]\n    fn test_to_from_be_bits_bn254_edge_cases() {\n        if crate::compat::is_bn254() {\n            // checking that decrementing this bit produces the expected 254 BE bits for (modulus - 1)\n            let mut p_minus_1_bits: [u1; 254] = modulus_be_bits().as_array();\n            assert(p_minus_1_bits[254 - 1] > 0);\n            p_minus_1_bits[254 - 1] -= 1;\n\n            let p_minus_1 = from_be_bits::<254>(p_minus_1_bits);\n            assert_eq(p_minus_1 + 1, 0);\n\n            // checking that converting (modulus - 1) from and then to 254 BE bits produces the same bits\n            let p_minus_1_converted_bits: [u1; 254] = p_minus_1.to_be_bits();\n            assert_eq(p_minus_1_converted_bits, p_minus_1_bits);\n\n            // checking that incrementing this bit produces 254 BE bits for (modulus + 4)\n            let mut p_plus_4_bits: [u1; 254] = modulus_be_bits().as_array();\n            assert(p_plus_4_bits[254 - 3] < 1);\n            p_plus_4_bits[254 - 3] += 1;\n\n            let p_plus_4 = from_be_bits::<254>(p_plus_4_bits);\n            assert_eq(p_plus_4, 4);\n\n            // checking that converting p_plus_4 to 254 BE bits produces the same\n            // bit set to 1 as p_plus_4_bits and otherwise zeroes\n            let mut p_plus_4_converted_bits: [u1; 254] = p_plus_4.to_be_bits();\n            assert_eq(p_plus_4_converted_bits[254 - 3], 1);\n            p_plus_4_converted_bits[254 - 3] = 0;\n            assert_eq(p_plus_4_converted_bits, [0; 254]);\n\n            // checking that Field::from_be_bits::<254> on the Field modulus produces 0\n            assert_eq(modulus_be_bits().len(), 254);\n            let p = from_be_bits::<254>(modulus_be_bits().as_array());\n            assert_eq(p, 0);\n\n            // checking that converting 0 to 254 BE bytes produces 254 zeroes\n            let p_bits: [u1; 254] = 0.to_be_bits();\n            assert_eq(p_bits, [0; 254]);\n        }\n    }\n\n    #[test]\n    fn test_to_from_le_bits_bn254_edge_cases() {\n        if crate::compat::is_bn254() {\n            // checking that decrementing this bit produces the expected 254 LE bits for (modulus - 1)\n            let mut p_minus_1_bits: [u1; 254] = modulus_le_bits().as_array();\n            assert(p_minus_1_bits[0] > 0);\n            p_minus_1_bits[0] -= 1;\n\n            let p_minus_1 = from_le_bits::<254>(p_minus_1_bits);\n            assert_eq(p_minus_1 + 1, 0);\n\n            // checking that converting (modulus - 1) from and then to 254 BE bits produces the same bits\n            let p_minus_1_converted_bits: [u1; 254] = p_minus_1.to_le_bits();\n            assert_eq(p_minus_1_converted_bits, p_minus_1_bits);\n\n            // checking that incrementing this bit produces 254 LE bits for (modulus + 4)\n            let mut p_plus_4_bits: [u1; 254] = modulus_le_bits().as_array();\n            assert(p_plus_4_bits[2] < 1);\n            p_plus_4_bits[2] += 1;\n\n            let p_plus_4 = from_le_bits::<254>(p_plus_4_bits);\n            assert_eq(p_plus_4, 4);\n\n            // checking that converting p_plus_4 to 254 LE bits produces the same\n            // bit set to 1 as p_plus_4_bits and otherwise zeroes\n            let mut p_plus_4_converted_bits: [u1; 254] = p_plus_4.to_le_bits();\n            assert_eq(p_plus_4_converted_bits[2], 1);\n            p_plus_4_converted_bits[2] = 0;\n            assert_eq(p_plus_4_converted_bits, [0; 254]);\n\n            // checking that Field::from_le_bits::<254> on the Field modulus produces 0\n            assert_eq(modulus_le_bits().len(), 254);\n            let p = from_le_bits::<254>(modulus_le_bits().as_array());\n            assert_eq(p, 0);\n\n            // checking that converting 0 to 254 LE bytes produces 254 zeroes\n            let p_bits: [u1; 254] = 0.to_le_bits();\n            assert_eq(p_bits, [0; 254]);\n        }\n    }\n}\n', path: "std/field/mod.nr" }, "19": { source: `// Exposed only for usage in \`std::meta\`
pub(crate) mod poseidon2;

use crate::default::Default;
use crate::embedded_curve_ops::{
    EmbeddedCurvePoint, EmbeddedCurveScalar, multi_scalar_mul, multi_scalar_mul_array_return,
};
use crate::meta::derive_via;

#[foreign(sha256_compression)]
// docs:start:sha256_compression
pub fn sha256_compression(input: [u32; 16], state: [u32; 8]) -> [u32; 8] {}
// docs:end:sha256_compression

#[foreign(keccakf1600)]
// docs:start:keccakf1600
pub fn keccakf1600(input: [u64; 25]) -> [u64; 25] {}
// docs:end:keccakf1600

pub mod keccak {
    #[deprecated("This function has been moved to std::hash::keccakf1600")]
    pub fn keccakf1600(input: [u64; 25]) -> [u64; 25] {
        super::keccakf1600(input)
    }
}

#[foreign(blake2s)]
// docs:start:blake2s
pub fn blake2s<let N: u32>(input: [u8; N]) -> [u8; 32]
// docs:end:blake2s
{}

// docs:start:blake3
pub fn blake3<let N: u32>(input: [u8; N]) -> [u8; 32]
// docs:end:blake3
{
    if crate::runtime::is_unconstrained() {
        // Temporary measure while Barretenberg is main proving system.
        // Please open an issue if you're working on another proving system and running into problems due to this.
        crate::static_assert(
            N <= 1024,
            "Barretenberg cannot prove blake3 hashes with inputs larger than 1024 bytes",
        );
    }
    __blake3(input)
}

#[foreign(blake3)]
fn __blake3<let N: u32>(input: [u8; N]) -> [u8; 32] {}

// docs:start:pedersen_commitment
pub fn pedersen_commitment<let N: u32>(input: [Field; N]) -> EmbeddedCurvePoint {
    // docs:end:pedersen_commitment
    pedersen_commitment_with_separator(input, 0)
}

#[inline_always]
pub fn pedersen_commitment_with_separator<let N: u32>(
    input: [Field; N],
    separator: u32,
) -> EmbeddedCurvePoint {
    let mut points = [EmbeddedCurveScalar { lo: 0, hi: 0 }; N];
    for i in 0..N {
        // we use the unsafe version because the multi_scalar_mul will constrain the scalars.
        points[i] = from_field_unsafe(input[i]);
    }
    let generators = derive_generators("DEFAULT_DOMAIN_SEPARATOR".as_bytes(), separator);
    multi_scalar_mul(generators, points)
}

// docs:start:pedersen_hash
pub fn pedersen_hash<let N: u32>(input: [Field; N]) -> Field
// docs:end:pedersen_hash
{
    pedersen_hash_with_separator(input, 0)
}

#[no_predicates]
pub fn pedersen_hash_with_separator<let N: u32>(input: [Field; N], separator: u32) -> Field {
    let mut scalars: [EmbeddedCurveScalar; N + 1] = [EmbeddedCurveScalar { lo: 0, hi: 0 }; N + 1];
    let mut generators: [EmbeddedCurvePoint; N + 1] =
        [EmbeddedCurvePoint::point_at_infinity(); N + 1];
    let domain_generators: [EmbeddedCurvePoint; N] =
        derive_generators("DEFAULT_DOMAIN_SEPARATOR".as_bytes(), separator);

    for i in 0..N {
        scalars[i] = from_field_unsafe(input[i]);
        generators[i] = domain_generators[i];
    }
    scalars[N] = EmbeddedCurveScalar { lo: N as Field, hi: 0 as Field };

    let length_generator: [EmbeddedCurvePoint; 1] =
        derive_generators("pedersen_hash_length".as_bytes(), 0);
    generators[N] = length_generator[0];
    multi_scalar_mul_array_return(generators, scalars, true)[0].x
}

#[field(bn254)]
#[inline_always]
pub fn derive_generators<let N: u32, let M: u32>(
    domain_separator_bytes: [u8; M],
    starting_index: u32,
) -> [EmbeddedCurvePoint; N] {
    crate::assert_constant(domain_separator_bytes);
    // TODO(https://github.com/noir-lang/noir/issues/5672): Add back assert_constant on starting_index
    __derive_generators(domain_separator_bytes, starting_index)
}

#[builtin(derive_pedersen_generators)]
#[field(bn254)]
fn __derive_generators<let N: u32, let M: u32>(
    domain_separator_bytes: [u8; M],
    starting_index: u32,
) -> [EmbeddedCurvePoint; N] {}

#[field(bn254)]
// Decompose the input 'bn254 scalar' into two 128 bits limbs.
// It is called 'unsafe' because it does not assert the limbs are 128 bits
// Assuming the limbs are 128 bits:
// Assert the decomposition does not overflow the field size.
fn from_field_unsafe(scalar: Field) -> EmbeddedCurveScalar {
    // Safety: xlo and xhi decomposition is checked below
    let (xlo, xhi) = unsafe { crate::field::bn254::decompose_hint(scalar) };
    // Check that the decomposition is correct
    assert_eq(scalar, xlo + crate::field::bn254::TWO_POW_128 * xhi);
    // Check that the decomposition does not overflow the field size
    let (a, b) = if xhi == crate::field::bn254::PHI {
        (xlo, crate::field::bn254::PLO)
    } else {
        (xhi, crate::field::bn254::PHI)
    };
    crate::field::bn254::assert_lt(a, b);

    EmbeddedCurveScalar { lo: xlo, hi: xhi }
}

pub fn poseidon2_permutation<let N: u32>(input: [Field; N], state_len: u32) -> [Field; N] {
    assert_eq(input.len(), state_len);
    poseidon2_permutation_internal(input)
}

#[foreign(poseidon2_permutation)]
fn poseidon2_permutation_internal<let N: u32>(input: [Field; N]) -> [Field; N] {}

// Generic hashing support.
// Partially ported and impacted by rust.

// Hash trait shall be implemented per type.
#[derive_via(derive_hash)]
pub trait Hash {
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher;
}

// docs:start:derive_hash
comptime fn derive_hash(s: TypeDefinition) -> Quoted {
    let name = quote { $crate::hash::Hash };
    let signature = quote { fn hash<H>(_self: Self, _state: &mut H) where H: $crate::hash::Hasher };
    let for_each_field = |name| quote { _self.$name.hash(_state); };
    crate::meta::make_trait_impl(
        s,
        name,
        signature,
        for_each_field,
        quote {},
        |fields| fields,
    )
}
// docs:end:derive_hash

// Hasher trait shall be implemented by algorithms to provide hash-agnostic means.
// TODO: consider making the types generic here ([u8], [Field], etc.)
pub trait Hasher {
    fn finish(self) -> Field;

    fn write(&mut self, input: Field);
}

// BuildHasher is a factory trait, responsible for production of specific Hasher.
pub trait BuildHasher {
    type H: Hasher;

    fn build_hasher(self) -> H;
}

pub struct BuildHasherDefault<H>;

impl<H> BuildHasher for BuildHasherDefault<H>
where
    H: Hasher + Default,
{
    type H = H;

    fn build_hasher(_self: Self) -> H {
        H::default()
    }
}

impl<H> Default for BuildHasherDefault<H>
where
    H: Hasher + Default,
{
    fn default() -> Self {
        BuildHasherDefault {}
    }
}

impl Hash for Field {
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        H::write(state, self);
    }
}

impl Hash for u1 {
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        H::write(state, self as Field);
    }
}

impl Hash for u8 {
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        H::write(state, self as Field);
    }
}

impl Hash for u16 {
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        H::write(state, self as Field);
    }
}

impl Hash for u32 {
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        H::write(state, self as Field);
    }
}

impl Hash for u64 {
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        H::write(state, self as Field);
    }
}

impl Hash for u128 {
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        H::write(state, self as Field);
    }
}

impl Hash for i8 {
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        H::write(state, self as u8 as Field);
    }
}

impl Hash for i16 {
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        H::write(state, self as u16 as Field);
    }
}

impl Hash for i32 {
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        H::write(state, self as u32 as Field);
    }
}

impl Hash for i64 {
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        H::write(state, self as u64 as Field);
    }
}

impl Hash for bool {
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        H::write(state, self as Field);
    }
}

impl Hash for () {
    fn hash<H>(_self: Self, _state: &mut H)
    where
        H: Hasher,
    {}
}

impl<T, let N: u32> Hash for [T; N]
where
    T: Hash,
{
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        for elem in self {
            elem.hash(state);
        }
    }
}

impl<T> Hash for [T]
where
    T: Hash,
{
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        self.len().hash(state);
        for elem in self {
            elem.hash(state);
        }
    }
}

impl<A, B> Hash for (A, B)
where
    A: Hash,
    B: Hash,
{
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        self.0.hash(state);
        self.1.hash(state);
    }
}

impl<A, B, C> Hash for (A, B, C)
where
    A: Hash,
    B: Hash,
    C: Hash,
{
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        self.0.hash(state);
        self.1.hash(state);
        self.2.hash(state);
    }
}

impl<A, B, C, D> Hash for (A, B, C, D)
where
    A: Hash,
    B: Hash,
    C: Hash,
    D: Hash,
{
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        self.0.hash(state);
        self.1.hash(state);
        self.2.hash(state);
        self.3.hash(state);
    }
}

impl<A, B, C, D, E> Hash for (A, B, C, D, E)
where
    A: Hash,
    B: Hash,
    C: Hash,
    D: Hash,
    E: Hash,
{
    fn hash<H>(self, state: &mut H)
    where
        H: Hasher,
    {
        self.0.hash(state);
        self.1.hash(state);
        self.2.hash(state);
        self.3.hash(state);
        self.4.hash(state);
    }
}

// Some test vectors for Pedersen hash and Pedersen Commitment.
// They have been generated using the same functions so the tests are for now useless
// but they will be useful when we switch to Noir implementation.
#[test]
fn assert_pedersen() {
    assert_eq(
        pedersen_hash_with_separator([1], 1),
        0x1b3f4b1a83092a13d8d1a59f7acb62aba15e7002f4440f2275edb99ebbc2305f,
    );
    assert_eq(
        pedersen_commitment_with_separator([1], 1),
        EmbeddedCurvePoint {
            x: 0x054aa86a73cb8a34525e5bbed6e43ba1198e860f5f3950268f71df4591bde402,
            y: 0x209dcfbf2cfb57f9f6046f44d71ac6faf87254afc7407c04eb621a6287cac126,
            is_infinite: false,
        },
    );

    assert_eq(
        pedersen_hash_with_separator([1, 2], 2),
        0x26691c129448e9ace0c66d11f0a16d9014a9e8498ee78f4d69f0083168188255,
    );
    assert_eq(
        pedersen_commitment_with_separator([1, 2], 2),
        EmbeddedCurvePoint {
            x: 0x2e2b3b191e49541fe468ec6877721d445dcaffe41728df0a0eafeb15e87b0753,
            y: 0x2ff4482400ad3a6228be17a2af33e2bcdf41be04795f9782bd96efe7e24f8778,
            is_infinite: false,
        },
    );
    assert_eq(
        pedersen_hash_with_separator([1, 2, 3], 3),
        0x0bc694b7a1f8d10d2d8987d07433f26bd616a2d351bc79a3c540d85b6206dbe4,
    );
    assert_eq(
        pedersen_commitment_with_separator([1, 2, 3], 3),
        EmbeddedCurvePoint {
            x: 0x1fee4e8cf8d2f527caa2684236b07c4b1bad7342c01b0f75e9a877a71827dc85,
            y: 0x2f9fedb9a090697ab69bf04c8bc15f7385b3e4b68c849c1536e5ae15ff138fd1,
            is_infinite: false,
        },
    );
    assert_eq(
        pedersen_hash_with_separator([1, 2, 3, 4], 4),
        0xdae10fb32a8408521803905981a2b300d6a35e40e798743e9322b223a5eddc,
    );
    assert_eq(
        pedersen_commitment_with_separator([1, 2, 3, 4], 4),
        EmbeddedCurvePoint {
            x: 0x07ae3e202811e1fca39c2d81eabe6f79183978e6f12be0d3b8eda095b79bdbc9,
            y: 0x0afc6f892593db6fbba60f2da558517e279e0ae04f95758587760ba193145014,
            is_infinite: false,
        },
    );
    assert_eq(
        pedersen_hash_with_separator([1, 2, 3, 4, 5], 5),
        0xfc375b062c4f4f0150f7100dfb8d9b72a6d28582dd9512390b0497cdad9c22,
    );
    assert_eq(
        pedersen_commitment_with_separator([1, 2, 3, 4, 5], 5),
        EmbeddedCurvePoint {
            x: 0x1754b12bd475a6984a1094b5109eeca9838f4f81ac89c5f0a41dbce53189bb29,
            y: 0x2da030e3cfcdc7ddad80eaf2599df6692cae0717d4e9f7bfbee8d073d5d278f7,
            is_infinite: false,
        },
    );
    assert_eq(
        pedersen_hash_with_separator([1, 2, 3, 4, 5, 6], 6),
        0x1696ed13dc2730062a98ac9d8f9de0661bb98829c7582f699d0273b18c86a572,
    );
    assert_eq(
        pedersen_commitment_with_separator([1, 2, 3, 4, 5, 6], 6),
        EmbeddedCurvePoint {
            x: 0x190f6c0e97ad83e1e28da22a98aae156da083c5a4100e929b77e750d3106a697,
            y: 0x1f4b60f34ef91221a0b49756fa0705da93311a61af73d37a0c458877706616fb,
            is_infinite: false,
        },
    );
    assert_eq(
        pedersen_hash_with_separator([1, 2, 3, 4, 5, 6, 7], 7),
        0x128c0ff144fc66b6cb60eeac8a38e23da52992fc427b92397a7dffd71c45ede3,
    );
    assert_eq(
        pedersen_commitment_with_separator([1, 2, 3, 4, 5, 6, 7], 7),
        EmbeddedCurvePoint {
            x: 0x015441e9d29491b06563fac16fc76abf7a9534c715421d0de85d20dbe2965939,
            y: 0x1d2575b0276f4e9087e6e07c2cb75aa1baafad127af4be5918ef8a2ef2fea8fc,
            is_infinite: false,
        },
    );
    assert_eq(
        pedersen_hash_with_separator([1, 2, 3, 4, 5, 6, 7, 8], 8),
        0x2f960e117482044dfc99d12fece2ef6862fba9242be4846c7c9a3e854325a55c,
    );
    assert_eq(
        pedersen_commitment_with_separator([1, 2, 3, 4, 5, 6, 7, 8], 8),
        EmbeddedCurvePoint {
            x: 0x1657737676968887fceb6dd516382ea13b3a2c557f509811cd86d5d1199bc443,
            y: 0x1f39f0cb569040105fa1e2f156521e8b8e08261e635a2b210bdc94e8d6d65f77,
            is_infinite: false,
        },
    );
    assert_eq(
        pedersen_hash_with_separator([1, 2, 3, 4, 5, 6, 7, 8, 9], 9),
        0x0c96db0790602dcb166cc4699e2d306c479a76926b81c2cb2aaa92d249ec7be7,
    );
    assert_eq(
        pedersen_commitment_with_separator([1, 2, 3, 4, 5, 6, 7, 8, 9], 9),
        EmbeddedCurvePoint {
            x: 0x0a3ceae42d14914a432aa60ec7fded4af7dad7dd4acdbf2908452675ec67e06d,
            y: 0xfc19761eaaf621ad4aec9a8b2e84a4eceffdba78f60f8b9391b0bd9345a2f2,
            is_infinite: false,
        },
    );
    assert_eq(
        pedersen_hash_with_separator([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10),
        0x2cd37505871bc460a62ea1e63c7fe51149df5d0801302cf1cbc48beb8dff7e94,
    );
    assert_eq(
        pedersen_commitment_with_separator([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10),
        EmbeddedCurvePoint {
            x: 0x2fb3f8b3d41ddde007c8c3c62550f9a9380ee546fcc639ffbb3fd30c8d8de30c,
            y: 0x300783be23c446b11a4c0fabf6c91af148937cea15fcf5fb054abf7f752ee245,
            is_infinite: false,
        },
    );
}
`, path: "std/hash/mod.nr" }, "51": { source: 'use dep::poseidon::poseidon2::Poseidon2::hash;\n\nmod merkle_tree;\n\nfn main(\n    //public inputs\n    root_hash: pub Field,\n    nullifier_hash: pub Field,\n    recipient_address: pub Field,\n    data_hash: pub Field, // 248-bit truncated Keccak256 hash of action context\n    amount_to_withdraw: pub Field,\n    new_commitment: pub Field,\n    //private inputs\n    nullifier: Field,\n    new_nullifier: Field,\n    secret: Field,\n    amount_in_pool: Field,\n    amount_left: Field,\n    merkle_proof: [Field; 20],\n    is_even: [bool; 20],\n) {\n    amount_in_pool.assert_max_bit_size::<120>();\n    amount_to_withdraw.assert_max_bit_size::<120>();\n    amount_left.assert_max_bit_size::<120>();\n    assert(amount_in_pool == amount_to_withdraw + amount_left, "Invalid amounts");\n\n    let commitment: Field = hash([nullifier, secret, amount_in_pool], 3);\n\n    let computed_nullifier_hash: Field = hash([nullifier], 1);\n    assert(computed_nullifier_hash == nullifier_hash, "Invalid nullifier hash");\n\n    let action_context_hash: Field = hash([recipient_address, data_hash], 2);\n\n    let computed_merkle_root = merkle_tree::compute_merkle_root(commitment, merkle_proof, is_even);\n    assert(computed_merkle_root == root_hash, "Invalid merkle proof");\n\n    let computed_new_commitment: Field =\n        hash([new_nullifier, secret, amount_left, action_context_hash], 4);\n    assert(computed_new_commitment == new_commitment, "Invalid new commitment");\n}\n', path: "/Users/obaloluwa/Documents/Personal Projects/privacy-protocol/circuits/src/main.nr" }, "52": { source: "use dep::poseidon::poseidon2::Poseidon2::hash;\n\npub(crate) fn compute_merkle_root(\n    leaf: Field,\n    merkle_proof: [Field; 20],\n    is_even: [bool; 20],\n) -> Field {\n    //mutable variable to store hash for the current level we are working on\n    let mut current_hash: Field = leaf;\n\n    //iterate through the levels\n    for i in 0..20 {\n        let (left, right) = if is_even[i] {\n            (current_hash, merkle_proof[i])\n        } else {\n            (merkle_proof[i], current_hash)\n        };\n\n        //compute hash for current level\n        current_hash = hash([left, right], 2);\n    }\n\n    current_hash\n}\n", path: "/Users/obaloluwa/Documents/Personal Projects/privacy-protocol/circuits/src/merkle_tree.nr" }, "60": { source: "use std::default::Default;\nuse std::hash::Hasher;\n\ncomptime global RATE: u32 = 3;\n\npub struct Poseidon2 {\n    cache: [Field; 3],\n    state: [Field; 4],\n    cache_size: u32,\n    squeeze_mode: bool, // 0 => absorb, 1 => squeeze\n}\n\nimpl Poseidon2 {\n    #[no_predicates]\n    pub fn hash<let N: u32>(input: [Field; N], message_size: u32) -> Field {\n        Poseidon2::hash_internal(input, message_size)\n    }\n\n    pub(crate) fn new(iv: Field) -> Poseidon2 {\n        let mut result =\n            Poseidon2 { cache: [0; 3], state: [0; 4], cache_size: 0, squeeze_mode: false };\n        result.state[RATE] = iv;\n        result\n    }\n\n    fn perform_duplex(&mut self) {\n        // add the cache into sponge state\n        self.state[0] += self.cache[0];\n        self.state[1] += self.cache[1];\n        self.state[2] += self.cache[2];\n        self.state = crate::poseidon2_permutation(self.state, 4);\n    }\n\n    fn absorb(&mut self, input: Field) {\n        assert(!self.squeeze_mode);\n        if self.cache_size == RATE {\n            // If we're absorbing, and the cache is full, apply the sponge permutation to compress the cache\n            self.perform_duplex();\n            self.cache[0] = input;\n            self.cache_size = 1;\n        } else {\n            // If we're absorbing, and the cache is not full, add the input into the cache\n            self.cache[self.cache_size] = input;\n            self.cache_size += 1;\n        }\n    }\n\n    fn squeeze(&mut self) -> Field {\n        assert(!self.squeeze_mode);\n        // If we're in absorb mode, apply sponge permutation to compress the cache.\n        self.perform_duplex();\n        self.squeeze_mode = true;\n\n        // Pop one item off the top of the permutation and return it.\n        self.state[0]\n    }\n\n    fn hash_internal<let N: u32>(input: [Field; N], in_len: u32) -> Field {\n        let two_pow_64 = 18446744073709551616;\n        let iv: Field = (in_len as Field) * two_pow_64;\n        let mut state = [0; 4];\n        state[RATE] = iv;\n\n        if std::runtime::is_unconstrained() {\n            for i in 0..(in_len / RATE) {\n                state[0] += input[i * RATE];\n                state[1] += input[i * RATE + 1];\n                state[2] += input[i * RATE + 2];\n                state = crate::poseidon2_permutation(state, 4);\n            }\n\n            // handle remaining elements after last full RATE-sized chunk\n            let num_extra_fields = in_len % RATE;\n            if num_extra_fields != 0 {\n                let remainder_start = in_len - num_extra_fields;\n                state[0] += input[remainder_start];\n                if num_extra_fields > 1 {\n                    state[1] += input[remainder_start + 1]\n                }\n            }\n        } else {\n            let mut states: [[Field; 4]; N / RATE + 1] = [[0; 4]; N / RATE + 1];\n            states[0] = state;\n\n            // process all full RATE-sized chunks, storing state after each permutation\n            for chunk_idx in 0..(N / RATE) {\n                for i in 0..RATE {\n                    state[i] += input[chunk_idx * RATE + i];\n                }\n                state = crate::poseidon2_permutation(state, 4);\n                states[chunk_idx + 1] = state;\n            }\n\n            // get state at the last full block before in_len\n            let first_partially_filled_chunk = in_len / RATE;\n            state = states[first_partially_filled_chunk];\n\n            // handle remaining elements after last full RATE-sized chunk\n            let remainder_start = (in_len / RATE) * RATE;\n            for j in 0..RATE {\n                let idx = remainder_start + j;\n                if idx < in_len {\n                    state[j] += input[idx];\n                }\n            }\n        }\n\n        // always run final permutation unless we just completed a full chunk\n        // still need to permute once if in_len is 0\n        if (in_len == 0) | (in_len % RATE != 0) {\n            state = crate::poseidon2_permutation(state, 4)\n        };\n\n        state[0]\n    }\n}\n\npub struct Poseidon2Hasher {\n    _state: [Field],\n}\n\nimpl Hasher for Poseidon2Hasher {\n    fn finish(self) -> Field {\n        let iv: Field = (self._state.len() as Field) * 18446744073709551616; // iv = (self._state.len() << 64)\n        let mut sponge = Poseidon2::new(iv);\n        for i in 0..self._state.len() {\n            sponge.absorb(self._state[i]);\n        }\n        sponge.squeeze()\n    }\n\n    fn write(&mut self, input: Field) {\n        self._state = self._state.push_back(input);\n    }\n}\n\nimpl Default for Poseidon2Hasher {\n    fn default() -> Self {\n        Poseidon2Hasher { _state: &[] }\n    }\n}\n", path: "/Users/obaloluwa/nargo/github.com/noir-lang/poseidon/v0.2.3/src/poseidon2.nr" } }, expression_width: { Bounded: { width: 4 } } };

// core/utils.ts
var utils_exports = {};
__export(utils_exports, {
  computeActionContextHash: () => computeActionContextHash,
  computeCommitment: () => computeCommitment,
  computeContextBoundCommitment: () => computeContextBoundCommitment,
  computeNullifierHash: () => computeNullifierHash,
  generateCommitment: () => generateCommitment
});
var bbInstance2;
var frClass2;
async function getFrClass2() {
  if (!frClass2) {
    const bbModule = await loadBb();
    frClass2 = bbModule.Fr;
  }
  return frClass2;
}
async function toFr2(value) {
  if (typeof value !== "string") {
    return value;
  }
  const FrCtor = await getFrClass2();
  if (value.startsWith("0x") || value.startsWith("0X")) {
    return new FrCtor(BigInt(value));
  }
  return FrCtor.fromString(value);
}
async function getBb2() {
  if (!bbInstance2) {
    const bbModule = await loadBb();
    const BarretenbergCtor = bbModule.Barretenberg;
    bbInstance2 = await BarretenbergCtor.new();
  }
  if (!bbInstance2) {
    throw new Error("Failed to initialize Barretenberg");
  }
  return bbInstance2;
}
async function generateCommitment(amount) {
  const bb = await getBb2();
  const FrCtor = await getFrClass2();
  const amountFr = new FrCtor(BigInt(amount));
  const nullifier = FrCtor.random();
  const secret = FrCtor.random();
  const commitment = await bb.poseidon2Hash([nullifier, secret, amountFr]);
  return {
    secret,
    nullifier,
    commitment
  };
}
async function computeNullifierHash(nullifier) {
  const bb = await getBb2();
  const nullifierFr = await toFr2(nullifier);
  return await bb.poseidon2Hash([nullifierFr]);
}
async function computeCommitment(nullifier, secret, amount) {
  const bb = await getBb2();
  const FrCtor = await getFrClass2();
  const nullifierFr = await toFr2(nullifier);
  const secretFr = await toFr2(secret);
  const amountFr = new FrCtor(BigInt(amount));
  return await bb.poseidon2Hash([nullifierFr, secretFr, amountFr]);
}
async function computeActionContextHash(externalAddress, dataHash) {
  const bb = await getBb2();
  const externalAddressFr = await toFr2(externalAddress);
  const dataHashFr = await toFr2(dataHash);
  return await bb.poseidon2Hash([externalAddressFr, dataHashFr]);
}
async function computeContextBoundCommitment(newNullifier, secret, amountLeft, externalAddress, dataHash) {
  const bb = await getBb2();
  const FrCtor = await getFrClass2();
  const newNullifierFr = await toFr2(newNullifier);
  const secretFr = await toFr2(secret);
  const amountLeftFr = new FrCtor(BigInt(amountLeft));
  const actionContextHash = await computeActionContextHash(
    externalAddress,
    dataHash
  );
  return await bb.poseidon2Hash([
    newNullifierFr,
    secretFr,
    amountLeftFr,
    actionContextHash
  ]);
}

// core/PrivacyProtocolSDK.ts
var DEFAULT_PRIVACY_PROTOCOL_CIRCUIT = circuits_default;
var DEFAULT_RELAYER_TRANSPORT_CONFIG = {
  url: "https://privacy-protocol-relayer.onrender.com",
  endpoint: "/relay",
  relayerPublicInputIndex: 6,
  relayerAddress: "0xead3818b12897994e10Cba6d311804A8800926B9",
  feePublicInputIndex: 7,
  relayerFeeWei: "1000000000000000"
};
var ZERO_BYTES32 = "0x" + "00".repeat(32);
var PRIVACY_PROTOCOL_POOL_ABI = [
  "function deposit(address token, uint256 amount, bytes32 commitment) external",
  "function withdraw(address token, address recipient, uint256 amount, bytes32 nullifierHash, bytes calldata proof, bytes32 rootHash, bytes32 calldataHash, bytes32 newCommitment) external",
  "function executeAction((address token, uint256 amount, address target, bytes data, bytes32 actionId, bytes32 nullifierHash, bytes proof, bytes32 rootHash, bytes32 newCommitment) request) external returns (bool success)",
  "event PrivacyProtocolPool__Deposit(address indexed token, bytes32 indexed commitment, uint256 indexed amount, uint32 insertedLeafIndex, uint256 timestamp)",
  "event PrivacyProtocolPool__Withdrawal(bytes32 indexed newCommitment, address indexed recipient, address indexed token, uint256 amount, uint32 insertedLeafIndex, uint256 timestamp)",
  "event PrivacyProtocolPool__ActionExecuted(bytes32 nullifierHash, address proxy)"
];
var PrivacyProtocolSDK = class {
  constructor(provider, contractAddress, circuit = DEFAULT_PRIVACY_PROTOCOL_CIRCUIT, options = {}) {
    this.provider = provider;
    this.contractAddress = contractAddress;
    this.circuit = circuit;
    this.options = options;
    this.contract = new ethers.Contract(
      contractAddress,
      PRIVACY_PROTOCOL_POOL_ABI,
      provider
    );
  }
  connect(signer) {
    return this.contract.connect(signer);
  }
  async deposit(token, amount, signer) {
    const { secret, nullifier, commitment } = await generateCommitment(amount);
    const commitmentHex = "0x" + Buffer.from(commitment.toBuffer()).toString("hex");
    const tx = await this.connect(signer).getFunction("deposit")(
      token,
      amount,
      commitmentHex
    );
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error("Deposit transaction failed");
    }
    return {
      secret: "0x" + Buffer.from(secret.toBuffer()).toString("hex"),
      nullifier: "0x" + Buffer.from(nullifier.toBuffer()).toString("hex"),
      commitment: commitmentHex,
      txHash: tx.hash
    };
  }
  async withdraw(token, recipient, amount, secret, nullifier, amountInPool, leaves, signer, executionOptions = {}) {
    const dataHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const {
      proof,
      publicInputs,
      newCommitment,
      newNullifier,
      rootHash,
      nullifierHash
    } = await this._generateProof(
      secret,
      nullifier,
      amountInPool,
      amount,
      recipient,
      dataHash,
      leaves
    );
    const relayResult = await this.submitToRelayer(
      proof,
      publicInputs,
      executionOptions,
      {
        operation: "withdraw",
        token,
        recipient,
        amount: amount.toString(),
        calldataHash: dataHash,
        nullifierHash,
        rootHash,
        newCommitment
      }
    );
    return {
      txHash: `relay:${relayResult.request_id}`,
      newSecret: secret,
      newNullifier,
      newCommitment,
      relayRequestId: relayResult.request_id,
      relayQueueLength: relayResult.queue_len,
      relayGasEstimate: relayResult.gas_estimate,
      relayMinRequiredFeeWei: relayResult.min_required_fee_wei
    };
  }
  async executeAction(token, amount, target, data, actionId, secret, nullifier, amountInPool, leaves, signer, executionOptions = {}) {
    const expectedActionId = ethers.keccak256(ethers.getBytes(secret));
    if (actionId.toLowerCase() !== expectedActionId.toLowerCase()) {
      throw new Error(
        "Invalid actionId: expected keccak256(secret) to allow proxy withdrawal"
      );
    }
    const fullHash = ethers.keccak256(
      ethers.concat([ethers.getBytes(actionId), ethers.getBytes(data)])
    );
    const hashBigInt = BigInt(fullHash);
    const truncatedHashBigInt = hashBigInt >> 8n;
    let truncatedHashHex = truncatedHashBigInt.toString(16);
    while (truncatedHashHex.length < 64) {
      truncatedHashHex = "0" + truncatedHashHex;
    }
    const dataHash = "0x" + truncatedHashHex;
    const {
      proof,
      publicInputs,
      newCommitment,
      newNullifier,
      rootHash,
      nullifierHash
    } = await this._generateProof(
      secret,
      nullifier,
      amountInPool,
      amount,
      target,
      dataHash,
      leaves
    );
    const relayResult = await this.submitToRelayer(
      proof,
      publicInputs,
      executionOptions,
      {
        operation: "executeAction",
        token,
        amount: amount.toString(),
        target,
        data,
        actionId,
        nullifierHash,
        rootHash,
        newCommitment
      }
    );
    return {
      txHash: `relay:${relayResult.request_id}`,
      newSecret: secret,
      newNullifier,
      newCommitment,
      relayRequestId: relayResult.request_id,
      relayQueueLength: relayResult.queue_len,
      relayGasEstimate: relayResult.gas_estimate,
      relayMinRequiredFeeWei: relayResult.min_required_fee_wei
    };
  }
  async getPrivateTransactionDetails(txHash) {
    const configuredRelayerAddress = this.resolveRelayerConfig().relayerAddress ?? "relayer";
    if (txHash.startsWith("relay:")) {
      const requestId = txHash.slice("relay:".length);
      if (requestId) {
        try {
          const relayStatus = await this.fetchRelayStatus(requestId);
          if (relayStatus.status === "submitted" && relayStatus.tx_hash) {
            try {
              return await this.getPrivateTransactionDetails(relayStatus.tx_hash);
            } catch {
              return {
                txHash: relayStatus.tx_hash,
                initiator: configuredRelayerAddress,
                gasPayer: configuredRelayerAddress,
                method: "relay_submission",
                methodId: "relay",
                parameters: "submitted via relayer",
                privacyLevel: "Private",
                gasUsed: null,
                status: "pending",
                to: this.contractAddress
              };
            }
          }
        } catch {
        }
      }
      return {
        txHash,
        initiator: configuredRelayerAddress,
        gasPayer: configuredRelayerAddress,
        method: "relay_submission",
        methodId: "relay",
        parameters: "queued via relayer",
        privacyLevel: "Private",
        gasUsed: null,
        status: "pending",
        to: null
      };
    }
    const tx = await this.provider.getTransaction(txHash);
    if (!tx) {
      throw new Error(`Transaction not found for hash: ${txHash}`);
    }
    const receipt = await this.provider.getTransactionReceipt(txHash);
    const methodId = tx.data ? tx.data.slice(0, 10) : "0x";
    let methodName = "verifyProof";
    try {
      const parsedTx = this.contract.interface.parseTransaction({
        data: tx.data
      });
      if (parsedTx?.name) {
        methodName = parsedTx.name;
      }
    } catch {
    }
    return {
      txHash,
      initiator: tx.from,
      gasPayer: tx.from,
      method: `${methodName} (${methodId})`,
      methodId,
      parameters: tx.data,
      privacyLevel: "Private",
      gasUsed: receipt?.gasUsed?.toString() ?? null,
      status: receipt ? receipt.status === 1 ? "success" : "reverted" : "pending",
      to: tx.to
    };
  }
  resolveRelayerStatusEndpoint(requestId) {
    const relayEndpoint = this.resolveRelayerEndpoint();
    const suffix = encodeURIComponent(requestId);
    return relayEndpoint.endsWith("/") ? `${relayEndpoint}${suffix}` : `${relayEndpoint}/${suffix}`;
  }
  async fetchRelayStatus(requestId) {
    const fetchFn = this.getRelayerFetch();
    const endpoint = this.resolveRelayerStatusEndpoint(requestId);
    const response = await fetchFn(endpoint, {
      method: "GET",
      headers: {
        ...this.options.relayer?.headers ?? {}
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch relay status (${response.status})`);
    }
    const body = await response.json();
    if (!body?.request_id || !body?.status) {
      throw new Error("Relayer status response is missing required fields");
    }
    return body;
  }
  normalizePublicInputWord(word) {
    if (typeof word === "string") {
      if (word.startsWith("0x") || word.startsWith("0X")) {
        const normalized = word.slice(2);
        if (normalized.length > 64) {
          throw new Error(`public input exceeds bytes32: ${word}`);
        }
        return `0x${normalized.padStart(64, "0")}`;
      }
      return this.normalizePublicInputWord(BigInt(word));
    }
    if (typeof word === "number") {
      return this.normalizePublicInputWord(BigInt(word));
    }
    if (typeof word === "bigint") {
      if (word < 0n) {
        throw new Error(`public input cannot be negative: ${word.toString()}`);
      }
      const hexValue = word.toString(16);
      if (hexValue.length > 64) {
        throw new Error(`public input exceeds bytes32: ${word.toString()}`);
      }
      return `0x${hexValue.padStart(64, "0")}`;
    }
    if (word instanceof Uint8Array) {
      if (word.length > 32) {
        throw new Error(`public input byte length exceeds 32: ${word.length}`);
      }
      const hexValue = ethers.hexlify(word).slice(2);
      return `0x${hexValue.padStart(64, "0")}`;
    }
    throw new Error(`unsupported public input value type: ${typeof word}`);
  }
  upsertPublicInputWord(words, index, value) {
    if (index < 0 || !Number.isInteger(index)) {
      throw new Error(`invalid public input index: ${index}`);
    }
    while (words.length <= index) {
      words.push(ZERO_BYTES32);
    }
    words[index] = value;
  }
  applyRelayerPublicInputs(publicInputs, options = {}) {
    const words = [...publicInputs];
    const relayerConfig = this.resolveRelayerConfig();
    const relayerIndex = options.relayerPublicInputIndex ?? relayerConfig?.relayerPublicInputIndex ?? void 0;
    const relayerAddress = options.relayerAddress ?? relayerConfig?.relayerAddress ?? void 0;
    if (relayerIndex !== void 0) {
      if (!relayerAddress) {
        throw new Error(
          "Missing relayerAddress for relayerPublicInputIndex. Configure SDK relayer options or pass execution options."
        );
      }
      const encodedAddress = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [relayerAddress]
      );
      this.upsertPublicInputWord(
        words,
        relayerIndex,
        this.normalizePublicInputWord(encodedAddress)
      );
    }
    const feeIndex = options.feePublicInputIndex ?? relayerConfig?.feePublicInputIndex;
    const relayerFeeWei = options.relayerFeeWei ?? relayerConfig?.relayerFeeWei;
    if (feeIndex !== void 0) {
      if (relayerFeeWei === void 0) {
        throw new Error(
          "Missing relayerFeeWei for feePublicInputIndex. Configure SDK relayer options or pass execution options."
        );
      }
      const encodedFee = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256"],
        [BigInt(relayerFeeWei)]
      );
      this.upsertPublicInputWord(
        words,
        feeIndex,
        this.normalizePublicInputWord(encodedFee)
      );
    }
    return words;
  }
  resolveRelayerEndpoint() {
    const relayerConfig = this.resolveRelayerConfig();
    const endpoint = relayerConfig.endpoint ?? "/relay";
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return endpoint;
    }
    const base = relayerConfig.url.endsWith("/") ? relayerConfig.url.slice(0, -1) : relayerConfig.url;
    const suffix = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${base}${suffix}`;
  }
  resolveRelayerConfig() {
    const configured = this.options.relayer ?? {};
    return {
      url: configured.url ?? DEFAULT_RELAYER_TRANSPORT_CONFIG.url,
      endpoint: configured.endpoint ?? DEFAULT_RELAYER_TRANSPORT_CONFIG.endpoint,
      relayerPublicInputIndex: configured.relayerPublicInputIndex ?? DEFAULT_RELAYER_TRANSPORT_CONFIG.relayerPublicInputIndex,
      relayerAddress: configured.relayerAddress ?? DEFAULT_RELAYER_TRANSPORT_CONFIG.relayerAddress,
      feePublicInputIndex: configured.feePublicInputIndex ?? DEFAULT_RELAYER_TRANSPORT_CONFIG.feePublicInputIndex,
      relayerFeeWei: configured.relayerFeeWei ?? DEFAULT_RELAYER_TRANSPORT_CONFIG.relayerFeeWei,
      headers: configured.headers,
      metadata: configured.metadata
    };
  }
  getRelayerFetch() {
    const fetchFn = globalThis.fetch;
    if (typeof fetchFn !== "function") {
      throw new Error(
        "Global fetch is unavailable in this runtime. Provide a fetch-capable environment for relayer transport."
      );
    }
    return fetchFn;
  }
  async submitToRelayer(proof, publicInputs, executionOptions, operationMetadata) {
    const fetchFn = this.getRelayerFetch();
    const relayerConfig = this.resolveRelayerConfig();
    const endpoint = this.resolveRelayerEndpoint();
    if (!Array.isArray(publicInputs)) {
      throw new Error("Proof generation did not return an array of publicInputs");
    }
    const normalizedPublicInputs = publicInputs.map(
      (word) => this.normalizePublicInputWord(word)
    );
    const relayerPublicInputs = this.applyRelayerPublicInputs(
      normalizedPublicInputs,
      executionOptions
    );
    const metadata = {
      ...relayerConfig?.metadata,
      ...operationMetadata,
      ...executionOptions.relayMetadata
    };
    const payload = {
      proof,
      public_inputs: relayerPublicInputs
    };
    if (Object.keys(metadata).length > 0) {
      payload.metadata = metadata;
    }
    const response = await fetchFn(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...relayerConfig?.headers ?? {}
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      let errorMessage = `Relayer request failed with status ${response.status}`;
      try {
        const body2 = await response.json();
        if (body2?.error) {
          errorMessage = `Relayer request failed: ${body2.error}`;
        }
      } catch {
        const bodyText = await response.text();
        if (bodyText) {
          errorMessage = `Relayer request failed: ${bodyText}`;
        }
      }
      throw new Error(errorMessage);
    }
    const body = await response.json();
    if (!body?.request_id) {
      throw new Error("Relayer response is missing request_id");
    }
    return body;
  }
  async _generateProof(secret, nullifier, amountInPool, amountToWithdraw, externalAddress, dataHash, leaves) {
    const bbModule = await loadBb();
    const Fr = bbModule.Fr;
    const UltraHonkBackend = bbModule.UltraHonkBackend;
    const amountLeft = BigInt(amountInPool) - BigInt(amountToWithdraw);
    const commitment = await computeCommitment(nullifier, secret, amountInPool);
    const tree = await merkleTree(leaves);
    const index = tree.getIndex(commitment.toString());
    if (index === -1) {
      throw new Error("Commitment not found in tree");
    }
    const merkleProof = tree.proof(index);
    const nullifierHash = await computeNullifierHash(nullifier);
    const newNullifier = Fr.random();
    const newCommitment = await computeContextBoundCommitment(
      newNullifier,
      secret,
      amountLeft,
      externalAddress,
      dataHash
    );
    if (!this.circuit) {
      throw new Error("Circuit not provided to SDK");
    }
    const noir = new Noir(this.circuit);
    const honk = new UltraHonkBackend(this.circuit.bytecode, { threads: 1 });
    const input = {
      root_hash: merkleProof.root.toString(),
      nullifier_hash: nullifierHash.toString(),
      recipient_address: externalAddress,
      data_hash: dataHash,
      amount_to_withdraw: amountToWithdraw.toString(),
      new_commitment: newCommitment.toString(),
      nullifier: Fr.fromString(nullifier).toString(),
      new_nullifier: newNullifier.toString(),
      secret: Fr.fromString(secret).toString(),
      amount_in_pool: amountInPool.toString(),
      amount_left: amountLeft.toString(),
      merkle_proof: merkleProof.pathElements.map((e) => e.toString()),
      is_even: merkleProof.pathIndices.map((i) => i % 2 === 0)
    };
    const { witness } = await noir.execute(input);
    const { proof, publicInputs } = await honk.generateProof(witness, {
      keccak: true
    });
    return {
      proof: "0x" + Buffer.from(proof).toString("hex"),
      publicInputs,
      newCommitment: "0x" + Buffer.from(newCommitment.toBuffer()).toString("hex"),
      newNullifier: "0x" + Buffer.from(newNullifier.toBuffer()).toString("hex"),
      rootHash: merkleProof.root.toString(),
      nullifierHash: "0x" + Buffer.from(nullifierHash.toBuffer()).toString("hex")
    };
  }
  async getLeaves(fromBlock = 0) {
    const depositFilter = this.contract.filters.PrivacyProtocolPool__Deposit();
    const withdrawalFilter = this.contract.filters.PrivacyProtocolPool__Withdrawal();
    const actionFilter = this.contract.filters.PrivacyProtocolPool__ActionExecuted();
    const [deposits, withdrawals, actions] = await Promise.all([
      this.contract.queryFilter(depositFilter, fromBlock),
      this.contract.queryFilter(withdrawalFilter, fromBlock),
      this.contract.queryFilter(actionFilter, fromBlock)
    ]);
    const events = [...deposits, ...withdrawals, ...actions].sort((a, b) => {
      if (a.blockNumber === b.blockNumber) {
        if (a.transactionIndex === b.transactionIndex) {
          return a.logIndex - b.logIndex;
        }
        return a.transactionIndex - b.transactionIndex;
      }
      return a.blockNumber - b.blockNumber;
    });
    const leaves = [];
    for (const event of events) {
      if (event.fragment?.name === "PrivacyProtocolPool__Deposit") {
        leaves.push(this.normalizePublicInputWord(event.args.commitment));
        continue;
      }
      if (event.fragment?.name === "PrivacyProtocolPool__Withdrawal") {
        leaves.push(this.normalizePublicInputWord(event.args.newCommitment));
        continue;
      }
      if (event.fragment?.name === "PrivacyProtocolPool__ActionExecuted") {
        const tx = await this.provider.getTransaction(event.transactionHash);
        if (!tx?.data) {
          continue;
        }
        const parsed = this.contract.interface.parseTransaction({ data: tx.data });
        if (!parsed || parsed.name !== "executeAction") {
          continue;
        }
        const request = parsed.args?.[0];
        const newCommitment = request?.newCommitment ?? request?.[8] ?? void 0;
        if (!newCommitment) {
          continue;
        }
        leaves.push(this.normalizePublicInputWord(newCommitment));
      }
    }
    return leaves;
  }
};

// core/index.ts
var core_default = PrivacyProtocolSDK;

export {
  merkleTree,
  utils_exports,
  DEFAULT_PRIVACY_PROTOCOL_CIRCUIT,
  DEFAULT_RELAYER_TRANSPORT_CONFIG,
  PrivacyProtocolSDK,
  core_default
};
//# sourceMappingURL=chunk-HYABS6WD.mjs.map