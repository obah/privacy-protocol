# Installation

To get started with the Privacy Protocol SDK, you need to install the core package and its dependencies.

## Prerequisites

- Node.js (v18 or later recommended)
- `ethers` (v6) for blockchain interaction

## Install Dependencies

Install the required packages using npm or yarn:

```bash
npm install ethers @aztec/bb.js @noir-lang/noir_js
```

or

```bash
yarn add ethers @aztec/bb.js @noir-lang/noir_js
```

## Setup

You will also need the compiled Noir circuit artifacts. Ensure you have the `circuits.json` file available in your project, which contains the bytecode for the privacy circuit.
