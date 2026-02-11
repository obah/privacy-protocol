import { Provider, Contract, Signer } from 'ethers';

interface DepositResult {
    secret: string;
    nullifier: string;
    commitment: string;
    txHash: string;
}
interface ExecutionResult {
    txHash: string;
    newSecret: string;
    newNullifier: string;
    newCommitment: string;
    proxyAddress?: string;
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
    constructor(provider: Provider, contractAddress: string, circuit?: any);
    connect(signer: Signer): Contract;
    deposit(token: string, amount: string | number | bigint, signer: Signer): Promise<DepositResult>;
    withdraw(token: string, recipient: string, amount: string | number | bigint, secret: string, nullifier: string, amountInPool: string | number | bigint, leaves: string[], signer: Signer): Promise<ExecutionResult>;
    executeAction(token: string, amount: string | number | bigint, target: string, data: string, actionId: string, secret: string, nullifier: string, amountInPool: string | number | bigint, leaves: string[], signer: Signer): Promise<ExecutionResult>;
    getPrivateTransactionDetails(txHash: string): Promise<PrivateTransactionDetails>;
    _generateProof(secret: string, nullifier: string, amountInPool: string | number | bigint, amountToWithdraw: string | number | bigint, externalAddress: string, dataHash: string, leaves: string[]): Promise<{
        proof: string;
        publicInputs: string[];
        newCommitment: string;
        newNullifier: string;
        rootHash: string;
        nullifierHash: string;
    }>;
    getLeaves(fromBlock?: number): Promise<string[]>;
}

export { type ActionRequest as A, DEFAULT_PRIVACY_PROTOCOL_CIRCUIT as D, type ExecutionResult as E, PrivacyProtocolSDK as P, type DepositResult as a, type PrivateTransactionDetails as b };
