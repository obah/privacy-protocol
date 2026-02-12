import { Provider, Contract, Signer } from 'ethers';

interface DepositResult {
    secret: string;
    nullifier: string;
    commitment: string;
    txHash: string;
}
interface RelayerTransportConfig {
    url: string;
    endpoint?: string;
    headers?: Record<string, string>;
    relayerPublicInputIndex?: number;
    relayerAddress?: string;
    feePublicInputIndex?: number;
    relayerFeeWei?: string | number | bigint;
    metadata?: Record<string, unknown>;
}
interface PrivacyProtocolSDKOptions {
    relayer?: RelayerTransportConfig;
}
interface ExecutionCallOptions {
    relayerPublicInputIndex?: number;
    relayerAddress?: string;
    feePublicInputIndex?: number;
    relayerFeeWei?: string | number | bigint;
    relayMetadata?: Record<string, unknown>;
}
interface ExecutionResult {
    txHash: string;
    newSecret: string;
    newNullifier: string;
    newCommitment: string;
    proxyAddress?: string;
    relayRequestId?: string;
    relayQueueLength?: number;
    relayGasEstimate?: string;
    relayMinRequiredFeeWei?: string;
}
interface ActionRequest {
    token: string;
    amount: string | number | bigint;
    target: string;
    data: string;
    actionId: string;
    nullifierHash: string;
    proof: string;
    rootHash: string;
    newCommitment: string;
}
interface PrivateTransactionDetails {
    txHash: string;
    initiator: string;
    gasPayer: string;
    method: string;
    methodId: string;
    parameters: string;
    privacyLevel: "Private";
    gasUsed: string | null;
    status: "pending" | "success" | "reverted";
    to: string | null;
}
declare const DEFAULT_PRIVACY_PROTOCOL_CIRCUIT: {
    noir_version: string;
    hash: string;
    abi: {
        parameters: ({
            name: string;
            type: {
                kind: string;
                length?: undefined;
                type?: undefined;
            };
            visibility: string;
        } | {
            name: string;
            type: {
                kind: string;
                length: number;
                type: {
                    kind: string;
                };
            };
            visibility: string;
        })[];
        return_type: null;
        error_types: {
            "1919566133504053500": {
                error_kind: string;
                string: string;
            };
            "6485997221020871071": {
                error_kind: string;
                string: string;
            };
            "11311738024492343678": {
                error_kind: string;
                string: string;
            };
            "13235270398509308954": {
                error_kind: string;
                string: string;
            };
            "13410961693771009187": {
                error_kind: string;
                string: string;
            };
        };
    };
    bytecode: string;
    debug_symbols: string;
    file_map: {
        "18": {
            source: string;
            path: string;
        };
        "50": {
            source: string;
            path: string;
        };
        "51": {
            source: string;
            path: string;
        };
        "59": {
            source: string;
            path: string;
        };
    };
    names: string[];
    brillig_names: never[];
};
declare class PrivacyProtocolSDK {
    provider: Provider;
    contractAddress: string;
    circuit: any;
    contract: Contract;
    options: PrivacyProtocolSDKOptions;
    constructor(provider: Provider, contractAddress: string, circuit?: any, options?: PrivacyProtocolSDKOptions);
    connect(signer: Signer): Contract;
    deposit(token: string, amount: string | number | bigint, signer: Signer): Promise<DepositResult>;
    withdraw(token: string, recipient: string, amount: string | number | bigint, secret: string, nullifier: string, amountInPool: string | number | bigint, leaves: string[], signer: Signer, executionOptions?: ExecutionCallOptions): Promise<ExecutionResult>;
    executeAction(token: string, amount: string | number | bigint, target: string, data: string, actionId: string, secret: string, nullifier: string, amountInPool: string | number | bigint, leaves: string[], signer: Signer, executionOptions?: ExecutionCallOptions): Promise<ExecutionResult>;
    getPrivateTransactionDetails(txHash: string): Promise<PrivateTransactionDetails>;
    private resolveRelayerStatusEndpoint;
    private fetchRelayStatus;
    private normalizePublicInputWord;
    private upsertPublicInputWord;
    private applyRelayerPublicInputs;
    private resolveRelayerEndpoint;
    private getRelayerFetch;
    private submitToRelayer;
    _generateProof(secret: string, nullifier: string, amountInPool: string | number | bigint, amountToWithdraw: string | number | bigint, externalAddress: string, dataHash: string, leaves: string[]): Promise<{
        proof: string;
        publicInputs: unknown[];
        newCommitment: string;
        newNullifier: string;
        rootHash: string;
        nullifierHash: string;
    }>;
    getLeaves(fromBlock?: number): Promise<string[]>;
}

export { type ActionRequest as A, DEFAULT_PRIVACY_PROTOCOL_CIRCUIT as D, type ExecutionCallOptions as E, PrivacyProtocolSDK as P, type RelayerTransportConfig as R, type DepositResult as a, type ExecutionResult as b, type PrivacyProtocolSDKOptions as c, type PrivateTransactionDetails as d };
