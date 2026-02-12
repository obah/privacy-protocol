import {
  PrivacyProtocolSDK
} from "../chunk-53HXHJOO.mjs";
import "../chunk-D57E6H3M.mjs";

// hooks/useLocalNotes.ts
import { useCallback, useEffect, useState } from "react";
var DEFAULT_STORAGE_KEY = "privacy-protocol:notes";
function readNotes(storageKey) {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function writeNotes(storageKey, notes) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(storageKey, JSON.stringify(notes));
}
function useLocalNotes(options = {}) {
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const [notes, setNotes] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setNotes(readNotes(storageKey));
    setIsHydrated(true);
  }, [storageKey]);
  const replaceNotes = useCallback(
    (nextNotes) => {
      setNotes(nextNotes);
      writeNotes(storageKey, nextNotes);
    },
    [storageKey]
  );
  const addNote = useCallback(
    (note) => {
      setNotes((currentNotes) => {
        const nextNotes = [note, ...currentNotes];
        writeNotes(storageKey, nextNotes);
        return nextNotes;
      });
    },
    [storageKey]
  );
  const upsertNote = useCallback(
    (note) => {
      setNotes((currentNotes) => {
        const currentIndex = currentNotes.findIndex(
          (existing) => existing.id === note.id
        );
        if (currentIndex === -1) {
          const nextNotes2 = [note, ...currentNotes];
          writeNotes(storageKey, nextNotes2);
          return nextNotes2;
        }
        const nextNotes = [...currentNotes];
        nextNotes[currentIndex] = note;
        writeNotes(storageKey, nextNotes);
        return nextNotes;
      });
    },
    [storageKey]
  );
  const removeNote = useCallback(
    (noteId) => {
      setNotes((currentNotes) => {
        const nextNotes = currentNotes.filter(
          (note) => note.id !== noteId
        );
        writeNotes(storageKey, nextNotes);
        return nextNotes;
      });
    },
    [storageKey]
  );
  const clearNotes = useCallback(() => {
    replaceNotes([]);
  }, [replaceNotes]);
  const getNoteByCommitment = useCallback(
    (commitment) => {
      return notes.find((note) => note.commitment === commitment) ?? null;
    },
    [notes]
  );
  return {
    notes,
    isHydrated,
    addNote,
    upsertNote,
    removeNote,
    clearNotes,
    getNoteByCommitment
  };
}

// hooks/useCommitments.ts
import { useCallback as useCallback2, useEffect as useEffect2, useState as useState2 } from "react";

// hooks/helpers.ts
function toError(error) {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}
function toAmountString(amount) {
  if (typeof amount === "bigint") {
    return amount.toString();
  }
  return String(amount);
}
async function resolveChainId(signer) {
  if (!signer?.provider) {
    return void 0;
  }
  const network = await signer.provider.getNetwork();
  return Number(network.chainId);
}
function buildPrivacyNote(args) {
  return {
    id: args.id ?? args.commitment,
    poolAddress: args.poolAddress,
    token: args.token,
    amount: toAmountString(args.amount),
    secret: args.secret,
    nullifier: args.nullifier,
    commitment: args.commitment,
    txHash: args.txHash,
    chainId: args.chainId,
    createdAt: Date.now(),
    metadata: args.metadata
  };
}

// hooks/usePrivacyProtocol.ts
import { useMemo } from "react";
function usePrivacyProtocol(options) {
  const { poolAddress, provider, signer, circuit, relayer } = options;
  const sdk = useMemo(() => {
    if (!provider || !poolAddress) {
      return null;
    }
    return new PrivacyProtocolSDK(provider, poolAddress, circuit, {
      relayer
    });
  }, [provider, poolAddress, circuit, relayer]);
  return {
    sdk,
    provider,
    signer: signer ?? null,
    isReady: Boolean(sdk && signer)
  };
}

// hooks/useCommitments.ts
function useCommitments(options) {
  const { fromBlock = 0, enabled = true, refetchIntervalMs = 0, ...contextOptions } = options;
  const { sdk } = usePrivacyProtocol(contextOptions);
  const [commitments, setCommitments] = useState2([]);
  const [isLoading, setIsLoading] = useState2(false);
  const [error, setError] = useState2(null);
  const refetch = useCallback2(async () => {
    if (!sdk) {
      throw new Error("PrivacyProtocolSDK is not initialized.");
    }
    setIsLoading(true);
    setError(null);
    try {
      const leaves = await sdk.getLeaves(fromBlock);
      setCommitments(leaves);
      return leaves;
    } catch (caughtError) {
      const nextError = toError(caughtError);
      setError(nextError);
      throw nextError;
    } finally {
      setIsLoading(false);
    }
  }, [sdk, fromBlock]);
  useEffect2(() => {
    if (!enabled || !sdk) {
      return;
    }
    let intervalId = null;
    void refetch();
    if (refetchIntervalMs > 0) {
      intervalId = setInterval(() => {
        void refetch();
      }, refetchIntervalMs);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, sdk, refetch, refetchIntervalMs]);
  return {
    commitments,
    isLoading,
    error,
    refetch,
    sdk
  };
}

// hooks/useDeposit.ts
import { useCallback as useCallback3, useState as useState3 } from "react";
function useDeposit(options) {
  const { poolAddress, onSuccess, onError, ...contextOptions } = options;
  const { sdk, signer } = usePrivacyProtocol({ poolAddress, ...contextOptions });
  const [data, setData] = useState3(null);
  const [note, setNote] = useState3(null);
  const [isPending, setIsPending] = useState3(false);
  const [error, setError] = useState3(null);
  const deposit = useCallback3(
    async (args) => {
      if (!sdk) {
        throw new Error("PrivacyProtocolSDK is not initialized.");
      }
      const txSigner = args.signer ?? signer;
      if (!txSigner) {
        throw new Error(
          "No signer available. Pass a signer in hook options or call args."
        );
      }
      setIsPending(true);
      setError(null);
      try {
        const result = await sdk.deposit(args.token, args.amount, txSigner);
        const chainId = await resolveChainId(txSigner);
        const createdNote = buildPrivacyNote({
          id: `${result.commitment}:${result.txHash}`,
          poolAddress,
          token: args.token,
          amount: toAmountString(args.amount),
          secret: result.secret,
          nullifier: result.nullifier,
          commitment: result.commitment,
          txHash: result.txHash,
          chainId,
          metadata: args.metadata
        });
        setData(result);
        setNote(createdNote);
        onSuccess?.(result, createdNote);
        return result;
      } catch (caughtError) {
        const nextError = toError(caughtError);
        setError(nextError);
        onError?.(nextError);
        throw nextError;
      } finally {
        setIsPending(false);
      }
    },
    [sdk, signer, poolAddress, onSuccess, onError]
  );
  const reset = useCallback3(() => {
    setData(null);
    setNote(null);
    setError(null);
    setIsPending(false);
  }, []);
  return {
    deposit,
    data,
    note,
    isPending,
    error,
    reset,
    sdk,
    signer,
    isReady: Boolean(sdk && signer)
  };
}

// hooks/useExecuteAction.ts
import { useCallback as useCallback4, useState as useState4 } from "react";
import { ethers } from "ethers";
function useExecuteAction(options) {
  const { poolAddress, onSuccess, onError, ...contextOptions } = options;
  const { sdk, signer } = usePrivacyProtocol({ poolAddress, ...contextOptions });
  const [data, setData] = useState4(null);
  const [nextNote, setNextNote] = useState4(null);
  const [isPending, setIsPending] = useState4(false);
  const [error, setError] = useState4(null);
  const executeAction = useCallback4(
    async (args) => {
      if (!sdk) {
        throw new Error("PrivacyProtocolSDK is not initialized.");
      }
      const txSigner = args.signer ?? signer;
      if (!txSigner) {
        throw new Error(
          "No signer available. Pass a signer in hook options or call args."
        );
      }
      const secret = args.secret ?? args.note?.secret;
      const nullifier = args.nullifier ?? args.note?.nullifier;
      const amountInPool = args.amountInPool ?? args.note?.amount;
      if (!secret || !nullifier) {
        throw new Error(
          "Missing secret or nullifier. Provide them directly or pass a note."
        );
      }
      if (amountInPool === void 0) {
        throw new Error(
          "Missing amountInPool. Provide it directly or pass a note."
        );
      }
      const actionId = args.actionId ?? ethers.keccak256(ethers.getBytes(secret));
      setIsPending(true);
      setError(null);
      try {
        const leaves = args.leaves ?? await sdk.getLeaves(args.fromBlock ?? 0);
        const result = await sdk.executeAction(
          args.token,
          args.amount,
          args.target,
          args.data,
          actionId,
          secret,
          nullifier,
          amountInPool,
          leaves,
          txSigner,
          args.executionOptions
        );
        const chainId = await resolveChainId(txSigner);
        const amountLeft = BigInt(toAmountString(amountInPool)) - BigInt(toAmountString(args.amount));
        const generatedNote = buildPrivacyNote({
          id: `${result.newCommitment}:${result.txHash}`,
          poolAddress,
          token: args.token,
          amount: amountLeft >= 0n ? amountLeft.toString() : "0",
          secret: result.newSecret,
          nullifier: result.newNullifier,
          commitment: result.newCommitment,
          txHash: result.txHash,
          chainId,
          metadata: {
            sourceNoteId: args.note?.id,
            target: args.target,
            actionId,
            proxyAddress: result.proxyAddress,
            type: "executeAction"
          }
        });
        setData(result);
        setNextNote(generatedNote);
        onSuccess?.(result, generatedNote);
        return result;
      } catch (caughtError) {
        const nextError = toError(caughtError);
        setError(nextError);
        onError?.(nextError);
        throw nextError;
      } finally {
        setIsPending(false);
      }
    },
    [sdk, signer, poolAddress, onSuccess, onError]
  );
  const reset = useCallback4(() => {
    setData(null);
    setNextNote(null);
    setError(null);
    setIsPending(false);
  }, []);
  return {
    executeAction,
    data,
    nextNote,
    isPending,
    error,
    reset,
    sdk,
    signer,
    isReady: Boolean(sdk && signer)
  };
}

// hooks/usePrivateTransactionDetails.ts
import { useCallback as useCallback5, useEffect as useEffect3, useState as useState5 } from "react";
function usePrivateTransactionDetails(options) {
  const { txHash, enabled = true, ...contextOptions } = options;
  const { sdk } = usePrivacyProtocol(contextOptions);
  const [data, setData] = useState5(null);
  const [isLoading, setIsLoading] = useState5(false);
  const [error, setError] = useState5(null);
  const refetch = useCallback5(async () => {
    if (!sdk) {
      throw new Error("PrivacyProtocolSDK is not initialized.");
    }
    if (!txHash) {
      throw new Error("txHash is required to fetch transaction details.");
    }
    setIsLoading(true);
    setError(null);
    try {
      const details = await sdk.getPrivateTransactionDetails(txHash);
      setData(details);
      return details;
    } catch (caughtError) {
      const nextError = toError(caughtError);
      setError(nextError);
      throw nextError;
    } finally {
      setIsLoading(false);
    }
  }, [sdk, txHash]);
  useEffect3(() => {
    if (!enabled || !txHash || !sdk) {
      return;
    }
    void refetch();
  }, [enabled, txHash, sdk, refetch]);
  return {
    data,
    isLoading,
    error,
    refetch,
    sdk
  };
}

// hooks/useWithdraw.ts
import { useCallback as useCallback6, useState as useState6 } from "react";
function useWithdraw(options) {
  const { poolAddress, onSuccess, onError, ...contextOptions } = options;
  const { sdk, signer } = usePrivacyProtocol({ poolAddress, ...contextOptions });
  const [data, setData] = useState6(null);
  const [nextNote, setNextNote] = useState6(null);
  const [isPending, setIsPending] = useState6(false);
  const [error, setError] = useState6(null);
  const withdraw = useCallback6(
    async (args) => {
      if (!sdk) {
        throw new Error("PrivacyProtocolSDK is not initialized.");
      }
      const txSigner = args.signer ?? signer;
      if (!txSigner) {
        throw new Error(
          "No signer available. Pass a signer in hook options or call args."
        );
      }
      const secret = args.secret ?? args.note?.secret;
      const nullifier = args.nullifier ?? args.note?.nullifier;
      const amountInPool = args.amountInPool ?? args.note?.amount;
      if (!secret || !nullifier) {
        throw new Error(
          "Missing secret or nullifier. Provide them directly or pass a note."
        );
      }
      if (amountInPool === void 0) {
        throw new Error(
          "Missing amountInPool. Provide it directly or pass a note."
        );
      }
      setIsPending(true);
      setError(null);
      try {
        const leaves = args.leaves ?? await sdk.getLeaves(args.fromBlock ?? 0);
        const result = await sdk.withdraw(
          args.token,
          args.recipient,
          args.amount,
          secret,
          nullifier,
          amountInPool,
          leaves,
          txSigner,
          args.executionOptions
        );
        const chainId = await resolveChainId(txSigner);
        const amountLeft = BigInt(toAmountString(amountInPool)) - BigInt(toAmountString(args.amount));
        const generatedNote = buildPrivacyNote({
          id: `${result.newCommitment}:${result.txHash}`,
          poolAddress,
          token: args.token,
          amount: amountLeft >= 0n ? amountLeft.toString() : "0",
          secret: result.newSecret,
          nullifier: result.newNullifier,
          commitment: result.newCommitment,
          txHash: result.txHash,
          chainId,
          metadata: {
            sourceNoteId: args.note?.id,
            recipient: args.recipient,
            type: "withdraw"
          }
        });
        setData(result);
        setNextNote(generatedNote);
        onSuccess?.(result, generatedNote);
        return result;
      } catch (caughtError) {
        const nextError = toError(caughtError);
        setError(nextError);
        onError?.(nextError);
        throw nextError;
      } finally {
        setIsPending(false);
      }
    },
    [sdk, signer, poolAddress, onSuccess, onError]
  );
  const reset = useCallback6(() => {
    setData(null);
    setNextNote(null);
    setError(null);
    setIsPending(false);
  }, []);
  return {
    withdraw,
    data,
    nextNote,
    isPending,
    error,
    reset,
    sdk,
    signer,
    isReady: Boolean(sdk && signer)
  };
}
export {
  useCommitments,
  useDeposit,
  useExecuteAction,
  useLocalNotes,
  usePrivacyProtocol,
  usePrivateTransactionDetails,
  useWithdraw
};
//# sourceMappingURL=index.mjs.map