# Contributing to Privacy Protocol

First off, thank you for considering contributing! Privacy Protocol is a public good, and your help makes the decentralized web more secure for everyone.

## Getting Started

1. Fork the repository and create your branch from `main`.

### Environment Setup

- **Contracts**: Install Foundry. Run `forge install`.
- **Relayer**: Install Rust. Navigate to `/relayer` and run `cargo build`.
- **Frontend/SDK**: Install Node.js. Run `npm install --legacy-peer-deps`.

### Local Testing

- For contracts: `forge test`
- For the relayer: `cargo test`

## Contribution Areas

We are currently looking for specialized help in the following areas:

- **Rust Development**: Optimizing the relayer for high throughput and developing the operator registration logic.
- **ZK-Circuits**: Optimizing our Noir circuits for lower proof-generation times in the browser.
- **UI/UX Design**: We need help professionalizing our dashboard and documentation site.

## Pull Request Process

1. Ensure any execution-level changes include corresponding tests.
2. Update the README.md or `/frontend/app/docs` if you are changing API surfaces or SDK hooks.
3. Tag the maintainers for a review. We aim to review all PRs within 48 hours.

## Code of Conduct

We follow standard open-source etiquette. Be kind, be helpful, and let's build a more private web together.
