# Privacy Protocol SDK

The Privacy Protocol SDK is a powerful TypeScript library that allows developers to easily integrate privacy features into their decentralized applications (dApps). Built on top of Aztec's Noir for zero-knowledge proofs, it provides a seamless interface for shielding assets, executing private transactions, and anonymous withdrawals.

## Features

- **Shield Assets**: Deposit tokens into a privacy pool to break the on-chain link between the depositor and the funds.
- **Private Execution**: Interact with any EVM smart contract (swap, vote, lend) anonymously using a temporary proxy identity.
- **Anonymous Withdrawals**: Withdraw funds to a fresh wallet without revealing the source of the funds.
- **Client-Side Proving**: Generate zero-knowledge proofs directly in the browser or Node.js environment, ensuring secrets never leave the user's device.

## Architecture

The SDK interacts with the `PrivacyProtocolPool` contract and utilizes `UltraHonk` backend for proof generation.

1.  **Deposit**: User generates a secret and nullifier locally, computes a commitment, and deposits funds on-chain with the commitment.
2.  **Withdraw/Execute**: User generates a ZK proof proving ownership of a commitment in the Merkle Tree without revealing which one.
3.  **Nullifiers**: Used to prevent double-spending of commitments.

## Next Steps

- [Installation](getting-started/installation.md)
- [Quickstart](getting-started/quickstart.md)
