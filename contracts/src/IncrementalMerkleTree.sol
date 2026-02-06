//SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Poseidon2, Field} from "poseidon/Poseidon2.sol";

contract IncrementalMerkleTree {
    Poseidon2 public immutable i_hasher;

    uint32 public immutable i_depth;
    uint32 public s_nextLeafIndex;
    uint32 public constant ROOT_MAX_SIZE = 30;
    uint32 public s_currentRootIndex;
    mapping(uint256 => bytes32) public s_roots;
    mapping(uint32 => bytes32) public s_cachedSubtrees;

    error IMT__InvalidTreeDepth(uint32 depth, uint8 minDepth, uint8 maxDepth);
    error IMT__OutOfBounds();
    error IMT__AmountIsZero();

    constructor(uint32 _depth, Poseidon2 _hasher) {
        if (_depth < 1 || _depth >= 32) {
            revert IMT__InvalidTreeDepth(_depth, 1, 32);
        }

        i_depth = _depth;
        i_hasher = _hasher;

        s_roots[0] = zeroes(_depth);
    }

    function _insert(bytes32 _commitment) internal returns (uint32) {
        uint32 _nextLeafIndex = s_nextLeafIndex;
        if (_nextLeafIndex == uint32(2) ** i_depth) {
            revert IMT__OutOfBounds();
        }

        uint32 currentLeafIndex = _nextLeafIndex;
        bytes32 currentHash = _commitment;
        bytes32 leftLeaf;
        bytes32 rightLeaf;
        for (uint32 i = 0; i < i_depth; i++) {
            if (currentLeafIndex % 2 == 0) {
                leftLeaf = currentHash;
                rightLeaf = zeroes(i);
                s_cachedSubtrees[i] = currentHash;
            } else {
                leftLeaf = s_cachedSubtrees[i];
                rightLeaf = currentHash;
            }
            currentHash = Field.toBytes32(i_hasher.hash_2(Field.toField(leftLeaf), Field.toField(rightLeaf)));
            currentLeafIndex /= 2;
        }
        uint32 currentRootIndex = (s_currentRootIndex + 1) % ROOT_MAX_SIZE;
        s_currentRootIndex = currentRootIndex;
        s_roots[currentRootIndex] = currentHash;
        s_nextLeafIndex += 1;

        return _nextLeafIndex;
    }

    function zeroes(uint32 _depth) public pure returns (bytes32) {
        if (_depth == 0) {
            return bytes32(0x16faccf02fa3d2e580fcf2d254903138cf8c67a463a5849d8f8558ac454d59ad);
        } else if (_depth == 1) {
            return bytes32(0x0b4cd30ce16c6f106a2dc36ffd4dcf2ab127e8271d1085ca35f82356ba400b9e);
        } else if (_depth == 2) {
            return bytes32(0x0210b61500422a6c30eb81faee1337f296cfbb55821519d1dd370d05fa2c69ea);
        } else if (_depth == 3) {
            return bytes32(0x0c25ac91b7b4d342d482d43b18587a3581bc55d86313d7d0dc1e8f66158db821);
        } else if (_depth == 4) {
            return bytes32(0x21f1d72137cc0ba7f04715660c1f459316c1b29b2265f5b85e2fba15318a961a);
        } else if (_depth == 5) {
            return bytes32(0x2bcb799266aadc8bc1d42cd477146428e1dcbb5c3ebe92bd7bcd9e35617e5fce);
        } else if (_depth == 6) {
            return bytes32(0x27cad244cc7971526337d84060ce1d5463b892ba1d9a8d936ba765c746a8bfc7);
        } else if (_depth == 7) {
            return bytes32(0x0e98be9b2df3f160c565fc172ab4d6727406349a0e80ebe48fefff331546f9de);
        } else if (_depth == 8) {
            return bytes32(0x17b4a631cbc0e641ade21bd54f6ee5d42672c77ca84aa4089fa8579fb60375dd);
        } else if (_depth == 9) {
            return bytes32(0x00d746e017b1c8f1418d9ecc50ad90a667462a55278b7982ec770c8ebd793703);
        } else if (_depth == 10) {
            return bytes32(0x2df7ab46f3268c2a5080be711335318bd392ed378624d1c8f41686311a5d3e78);
        } else if (_depth == 11) {
            return bytes32(0x1365b04501ee440beafde6075b36ceeb6b586ce3b85ac44fdb7ed92d968d67b1);
        } else if (_depth == 12) {
            return bytes32(0x2d2c94ea8d7ca11bb96ffdeaf8b7870e631c051529843fe9c7b28ffdc85fbe08);
        } else if (_depth == 13) {
            return bytes32(0x1adfc43a77280c7aabea2bcfd9379729eaa72b211227cbbb480020659886594a);
        } else if (_depth == 14) {
            return bytes32(0x036873bdf3324e5b54be89bb1d8eb2646b5f6c187cdd69166c940fe456f8586f);
        } else if (_depth == 15) {
            return bytes32(0x05a0e09f6be2c7df1cff366ab8b8b4db8fc988808c6584f3e0beead2513a02c3);
        } else if (_depth == 16) {
            return bytes32(0x06131a3c1c5087863c8da31be5185684cb83f200cd04f7d229dc243003dcc1dd);
        } else if (_depth == 17) {
            return bytes32(0x1d3245c71d673006e2edd4b7e6f39430aebb425ce583fa1811f84ae71d6808de);
        } else if (_depth == 18) {
            return bytes32(0x1e78886459c1c33286a2def6bab81afcb63f4be32d85cb4f18d4da1dd3cb8836);
        } else if (_depth == 19) {
            return bytes32(0x1738f5c4a9c5e7300f7176514502da252259123a2a6dfe7a4148e46155d2a8d2);
        } else if (_depth == 20) {
            return bytes32(0x207c726d331c3499c31fe085a5ce7f4dff27362f5344cc7b751b4b1c5b9f1cb0);
        } else if (_depth == 21) {
            return bytes32(0x2fc327498f36664dfe5b2fa464d70fce424b8f9a1b1568294759bdc704f46c74);
        } else if (_depth == 22) {
            return bytes32(0x1d9ebb7b1c5593008bd2f5ad430aeacd74db801c7b8ce7ed690acbf3fd33bc74);
        } else if (_depth == 23) {
            return bytes32(0x2156cd36c486cd0361afdcacdb7ce19726295733954d026fed8b798138a94c9a);
        } else if (_depth == 24) {
            return bytes32(0x238661821b25bec4ee3906c1fae3e2f3bbef961c2d881bb6fb444ab84e4f4447);
        } else if (_depth == 25) {
            return bytes32(0x2481cdbc2b6e54d6c18b92a439fa152dbd593621b59ab4aab7b8f5c322c8756a);
        } else if (_depth == 26) {
            return bytes32(0x2260074181de538e0f914fbb1b57795b459d0b7db3fe7c70c099f6076e3da3cb);
        } else if (_depth == 27) {
            return bytes32(0x1e5985ae00a30c32ac592263abf716177e2506d67fa3b3eb37fc968fb3adfa0a);
        } else if (_depth == 28) {
            return bytes32(0x249223f1a2809b00a6cc24e75ac51933e2dc9c96ce1d32e39c94ee840634096f);
        } else if (_depth == 29) {
            return bytes32(0x269853cb74336efc23bd93884322f6caf13d5e98e1eee87262377fb7d5e1920e);
        } else if (_depth == 30) {
            return bytes32(0x1e6d1103cf3eb8a1236fa516130d9b8c1ef1ac2e1957af1a16e3387bad64f886);
        } else if (_depth == 31) {
            return bytes32(0x0b9ee2ebaadaf6089b7124c56cd35397ca4992eda1bc54345d5de38775a2cc4c);
        } else {
            revert IMT__OutOfBounds();
        }
    }
}
