export { A as ActionRequest, D as DEFAULT_PRIVACY_PROTOCOL_CIRCUIT, a as DepositResult, E as ExecutionCallOptions, b as ExecutionResult, P as PrivacyProtocolSDK, c as PrivacyProtocolSDKOptions, d as PrivateTransactionDetails, R as RelayerTransportConfig, P as default } from './PrivacyProtocolSDK-BPTBHIYn.mjs';
import 'ethers';

interface MerkleProof {
    root: string;
    pathElements: string[];
    pathIndices: number[];
    leaf: string;
}
declare class PoseidonTree {
    levels: number;
    zeros: string[];
    storage: Map<string, string>;
    totalLeaves: number;
    constructor(levels: number, zeros: string[]);
    init(defaultLeaves?: string[]): Promise<void>;
    static indexToKey(level: number, index: number): string;
    getIndex(leaf: string): number;
    root(): string;
    proof(index: number): MerkleProof;
    insert(leaf: string): Promise<void>;
    update(index: number, newLeaf: string, isInsert?: boolean): Promise<void>;
    traverse(index: number, fn: (level: number, currentIndex: number, siblingIndex: number) => void): void;
    traverseAsync(index: number, fn: (level: number, currentIndex: number, siblingIndex: number) => Promise<void>): Promise<void>;
}
declare function merkleTree(leaves: string[]): Promise<PoseidonTree>;

interface BbFr {
    toString(): string;
    toBuffer(): Uint8Array;
}

/**
 * Generates a commitment for a given amount.
 */
declare function generateCommitment(amount: string | number | bigint): Promise<CommitmentData>;
/**
 * Computes the nullifier hash.
 */
declare function computeNullifierHash(nullifier: BbFr | string): Promise<BbFr>;
/**
 * Computes a new commitment.
 */
declare function computeCommitment(nullifier: BbFr | string, secret: BbFr | string, amount: string | number | bigint): Promise<BbFr>;
/**
 * Computes the action context hash from external call address and data hash.
 */
declare function computeActionContextHash(externalAddress: BbFr | string, dataHash: BbFr | string): Promise<BbFr>;
/**
 * Computes the new output commitment bound to action context.
 */
declare function computeContextBoundCommitment(newNullifier: BbFr | string, secret: BbFr | string, amountLeft: string | number | bigint, externalAddress: BbFr | string, dataHash: BbFr | string): Promise<BbFr>;
interface CommitmentData {
    secret: BbFr;
    nullifier: BbFr;
    commitment: BbFr;
}

type utils_CommitmentData = CommitmentData;
declare const utils_computeActionContextHash: typeof computeActionContextHash;
declare const utils_computeCommitment: typeof computeCommitment;
declare const utils_computeContextBoundCommitment: typeof computeContextBoundCommitment;
declare const utils_computeNullifierHash: typeof computeNullifierHash;
declare const utils_generateCommitment: typeof generateCommitment;
declare namespace utils {
  export { type utils_CommitmentData as CommitmentData, utils_computeActionContextHash as computeActionContextHash, utils_computeCommitment as computeCommitment, utils_computeContextBoundCommitment as computeContextBoundCommitment, utils_computeNullifierHash as computeNullifierHash, utils_generateCommitment as generateCommitment };
}

export { merkleTree, utils };
