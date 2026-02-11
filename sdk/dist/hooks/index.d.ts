import { P as PrivacyProtocolSDK, a as DepositResult, E as ExecutionResult, b as PrivateTransactionDetails } from '../PrivacyProtocolSDK-CpYDmC1y.js';
import { Provider, Signer, ethers } from 'ethers';

type AmountLike = string | number | bigint;
interface PrivacyNote {
    id: string;
    poolAddress: string;
    token: string;
    amount: string;
    secret: string;
    nullifier: string;
    commitment: string;
    txHash: string;
    createdAt: number;
    chainId?: number;
    metadata?: Record<string, unknown>;
}

interface UseLocalNotesOptions {
    storageKey?: string;
}
declare function useLocalNotes(options?: UseLocalNotesOptions): {
    notes: PrivacyNote[];
    isHydrated: boolean;
    addNote: (note: PrivacyNote) => void;
    upsertNote: (note: PrivacyNote) => void;
    removeNote: (noteId: string) => void;
    clearNotes: () => void;
    getNoteByCommitment: (commitment: string) => PrivacyNote | null;
};

interface UsePrivacyProtocolOptions {
    poolAddress: string;
    provider: Provider | null;
    signer?: Signer | null;
    circuit?: any;
}
interface PrivacyProtocolContext {
    sdk: PrivacyProtocolSDK | null;
    provider: Provider | null;
    signer: Signer | null;
    isReady: boolean;
}
declare function usePrivacyProtocol(options: UsePrivacyProtocolOptions): PrivacyProtocolContext;

interface UseCommitmentsOptions extends UsePrivacyProtocolOptions {
    fromBlock?: number;
    enabled?: boolean;
    refetchIntervalMs?: number;
}
declare function useCommitments(options: UseCommitmentsOptions): {
    commitments: string[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<string[]>;
    sdk: PrivacyProtocolSDK | null;
};

interface DepositArgs {
    token: string;
    amount: AmountLike;
    signer?: Signer;
    metadata?: Record<string, unknown>;
}
interface UseDepositOptions extends UsePrivacyProtocolOptions {
    onSuccess?: (result: DepositResult, note: PrivacyNote) => void;
    onError?: (error: Error) => void;
}
declare function useDeposit(options: UseDepositOptions): {
    deposit: (args: DepositArgs) => Promise<DepositResult>;
    data: DepositResult | null;
    note: PrivacyNote | null;
    isPending: boolean;
    error: Error | null;
    reset: () => void;
    sdk: PrivacyProtocolSDK | null;
    signer: Signer | null;
    isReady: boolean;
};

interface ExecuteActionArgs {
    token: string;
    amount: AmountLike;
    target: string;
    data: string;
    amountInPool?: AmountLike;
    actionId?: string;
    secret?: string;
    nullifier?: string;
    note?: PrivacyNote;
    leaves?: string[];
    fromBlock?: number;
    signer?: Signer;
}
interface UseExecuteActionOptions extends UsePrivacyProtocolOptions {
    onSuccess?: (result: ExecutionResult, newNote: PrivacyNote) => void;
    onError?: (error: Error) => void;
}
declare function useExecuteAction(options: UseExecuteActionOptions): {
    executeAction: (args: ExecuteActionArgs) => Promise<ExecutionResult>;
    data: ExecutionResult | null;
    nextNote: PrivacyNote | null;
    isPending: boolean;
    error: Error | null;
    reset: () => void;
    sdk: PrivacyProtocolSDK | null;
    signer: ethers.Signer | null;
    isReady: boolean;
};

interface UsePrivateTransactionDetailsOptions extends UsePrivacyProtocolOptions {
    txHash?: string;
    enabled?: boolean;
}
declare function usePrivateTransactionDetails(options: UsePrivateTransactionDetailsOptions): {
    data: PrivateTransactionDetails | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<PrivateTransactionDetails>;
    sdk: PrivacyProtocolSDK | null;
};

interface WithdrawArgs {
    token: string;
    recipient: string;
    amount: AmountLike;
    amountInPool?: AmountLike;
    secret?: string;
    nullifier?: string;
    note?: PrivacyNote;
    leaves?: string[];
    fromBlock?: number;
    signer?: Signer;
}
interface UseWithdrawOptions extends UsePrivacyProtocolOptions {
    onSuccess?: (result: ExecutionResult, newNote: PrivacyNote) => void;
    onError?: (error: Error) => void;
}
declare function useWithdraw(options: UseWithdrawOptions): {
    withdraw: (args: WithdrawArgs) => Promise<ExecutionResult>;
    data: ExecutionResult | null;
    nextNote: PrivacyNote | null;
    isPending: boolean;
    error: Error | null;
    reset: () => void;
    sdk: PrivacyProtocolSDK | null;
    signer: Signer | null;
    isReady: boolean;
};

export { type AmountLike, type DepositArgs, type ExecuteActionArgs, type PrivacyNote, type PrivacyProtocolContext, type UseCommitmentsOptions, type UseDepositOptions, type UseExecuteActionOptions, type UseLocalNotesOptions, type UsePrivacyProtocolOptions, type UsePrivateTransactionDetailsOptions, type UseWithdrawOptions, type WithdrawArgs, useCommitments, useDeposit, useExecuteAction, useLocalNotes, usePrivacyProtocol, usePrivateTransactionDetails, useWithdraw };
