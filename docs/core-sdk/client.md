# Client Reference

The `PrivacyProtocolSDK` is the main entry point for interacting with the protocol.

## `PrivacyProtocolSDK`

### Constructor

```typescript
constructor(provider: Provider, contractAddress: string, circuit: any)
```

-   `provider`: An `ethers.Provider` instance.
-   `contractAddress`: The address of the `PrivacyProtocolPool` contract.
-   `circuit`: The compiled Noir circuit JSON object.

---

### `connect`

```typescript
connect(signer: Signer): Contract
```

Connects a signer to the internal contract instance for write operations.

-   `signer`: An `ethers.Signer`.
-   **Returns**: The connected `Contract` instance.

---

### `deposit`

Shields ERC20 tokens by depositing them into the pool.

```typescript
async deposit(
  token: string,
  amount: string | number | bigint,
  signer: Signer
): Promise<DepositResult>
```

-   `token`: Address of the ERC20 token.
-   `amount`: Amount to deposit.
-   `signer`: The signer executing the transaction.
-   **Returns**: `Promise<DepositResult>` containing the generated secret, nullifier, and commitment.

**DepositResult Interface:**
```typescript
interface DepositResult {
  secret: string;
  nullifier: string;
  commitment: string;
  txHash: string;
}
```

---

### `withdraw`

Unshields tokens by withdrawing them to a recipient address. Generates a ZK proof locally.

```typescript
async withdraw(
  token: string,
  recipient: string,
  amount: string | number | bigint,
  secret: string,
  nullifier: string,
  amountInPool: string | number | bigint,
  leaves: string[],
  signer: Signer
): Promise<ExecutionResult>
```

-   `token`: Token address.
-   `recipient`: Address receiving the funds.
-   `amount`: Amount to withdraw.
-   `secret`: The secret key from the note (hex string).
-   `nullifier`: The nullifier from the note (hex string).
-   `amountInPool`: The total value of the note being spent.
-   `leaves`: Current Merkle Tree leaves (fetch via `getLeaves`).
-   `signer`: Transaction signer (relayer or user).
-   **Returns**: `Promise<ExecutionResult>`

**ExecutionResult Interface:**
```typescript
interface ExecutionResult {
  txHash: string;
  newSecret: string;
  newNullifier: string;
  newCommitment: string;
  proxyAddress?: string;
}
```

---

### `executeAction`

Executes an arbitrary call on an external contract using a temporary proxy, funded by the shielded note.

```typescript
async executeAction(
  token: string,
  amount: string | number | bigint,
  target: string,
  data: string,
  actionId: string,
  secret: string,
  nullifier: string,
  amountInPool: string | number | bigint,
  leaves: string[],
  signer: Signer
): Promise<ExecutionResult>
```

-   `target`: The target contract address to call.
-   `data`: The calldata for the transaction.
-   `actionId`: Must be `keccak256(secret)` so proxy withdrawal can be authorized with that secret.
-   **Returns**: `Promise<ExecutionResult>` containing the new note details and the deployed proxy address.

---

### `getLeaves`

Fetches all active commitments (leaves) from the contract events to rebuild the Merkle Tree.

```typescript
async getLeaves(fromBlock: number = 0): Promise<string[]>
```

-   `fromBlock`: Block number to start searching from (default: 0).
-   **Returns**: An array of commitment strings sorted by insertion index.
