"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, Info, Loader2 } from "lucide-react";
import Faucet from "./Faucet";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { DEMO_CONTRACTS, DEMO_DEFI_ABI, ERC20_ABI } from "@/lib/demo-config";
import { formatEther, parseEther } from "viem";
import { toast } from "sonner";
import type {
  NormalTransactionReporter,
  PrivateTransactionReporter,
} from "./transaction-log-types";
import { Contract, Interface } from "ethers";
import {
  useDeposit,
  useExecuteAction,
} from "privacy-protocol/hooks";
import type { PrivateTransactionDetails } from "privacy-protocol/core";
import { useEthersFromWagmi } from "@/lib/useEthersFromWagmi";

interface DefiDemoContentProps {
  isIncognito: boolean;
  onNormalTransaction?: NormalTransactionReporter;
  onPrivateTransaction?: PrivateTransactionReporter;
}

export default function DefiDemoContent({
  isIncognito,
  onNormalTransaction,
  onPrivateTransaction,
}: DefiDemoContentProps) {
  const { address } = useAccount();
  const { provider, signer } = useEthersFromWagmi();
  const [amountIn, setAmountIn] = useState("");
  const [pendingTxType, setPendingTxType] = useState<
    "approval" | "swap" | null
  >(null);
  const [isPrivatePending, setIsPrivatePending] = useState(false);
  const lastLoggedHashRef = useRef<`0x${string}` | null>(null);
  const swapInterface = new Interface([
    "function swap(address tokenIn, uint256 amountIn, address tokenOut)",
  ]);

  const { deposit, sdk: privacySdk, isReady: isPrivacyReady } = useDeposit({
    poolAddress: DEMO_CONTRACTS.PrivacyProtocolPool,
    provider,
    signer,
  });
  const { executeAction } = useExecuteAction({
    poolAddress: DEMO_CONTRACTS.PrivacyProtocolPool,
    provider,
    signer,
  });

  const { data: ppUSDBalance } = useReadContract({
    address: DEMO_CONTRACTS.ppUSD,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address, refetchInterval: 2000 },
  });

  const { data: USDTppBalance } = useReadContract({
    address: DEMO_CONTRACTS.USDTpp,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address, refetchInterval: 2000 },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: DEMO_CONTRACTS.ppUSD,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [
      address || "0x0000000000000000000000000000000000000000",
      DEMO_CONTRACTS.DemoDefi,
    ],
    query: { enabled: !!address },
  });

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const needsApproval =
    amountIn && allowance !== undefined
      ? allowance < parseEther(amountIn || "0")
      : false;

  const isPending = isIncognito
    ? isPrivatePending
    : isWritePending || isConfirming;

  const logPrivateTransaction = async (
    hash: string,
    methodHint: string,
    parametersHint: string,
    details: PrivateTransactionDetails | null,
    metadata?: Record<string, string | undefined>,
  ) => {
    if (!onPrivateTransaction) {
      return;
    }

    onPrivateTransaction({
      hash: hash as `0x${string}`,
      source: "defi",
      methodHint,
      parametersHint,
      privacyLevel: "Private",
      metadata: {
        initiator: details?.initiator,
        gasPayer: details?.gasPayer,
        method: details?.method,
        methodId: details?.methodId,
        parameters: details?.parameters,
        status: details?.status,
        to: details?.to,
        proxyAddress: metadata?.proxyAddress,
        noteCommitment: metadata?.noteCommitment,
      },
    });
  };

  useEffect(() => {
    if (isIncognito) {
      return;
    }

    if (!hash || !onNormalTransaction || lastLoggedHashRef.current === hash) {
      return;
    }

    const txKind = pendingTxType === "approval" ? "approve" : "swap";
    const parametersHint =
      txKind === "approve"
        ? `spender=${DEMO_CONTRACTS.DemoDefi}, amount=${amountIn || "0"}`
        : `amountIn=${amountIn || "0"}`;

    onNormalTransaction({
      hash,
      source: "defi",
      methodHint: txKind,
      parametersHint,
      privacyLevel: "Public",
    });
    lastLoggedHashRef.current = hash;
  }, [isIncognito, hash, onNormalTransaction, pendingTxType, amountIn]);

  useEffect(() => {
    if (isIncognito) {
      return;
    }

    if (isSuccess && pendingTxType) {
      if (pendingTxType === "approval") {
        toast.success("Approval successful! Initiating swap...");
        refetchAllowance();
        setTimeout(() => {
          setPendingTxType("swap");
          writeContract({
            address: DEMO_CONTRACTS.DemoDefi,
            abi: DEMO_DEFI_ABI,
            functionName: "swap",
            args: [parseEther(amountIn)],
          });
        }, 1000);
      } else if (pendingTxType === "swap") {
        toast.success("Swap successful!");
        setTimeout(() => {
          setAmountIn("");
          setPendingTxType(null);
        }, 0);
      }
    }
    if (writeError) {
      toast.error(`Transaction failed: ${writeError.message}`);
      setTimeout(() => {
        setPendingTxType(null);
      }, 0);
    }
  }, [
    isIncognito,
    isSuccess,
    writeError,
    refetchAllowance,
    pendingTxType,
    amountIn,
    writeContract,
  ]);

  const handleAction = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!amountIn || Number(amountIn) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const parsedAmount = parseEther(amountIn);

    if (isIncognito) {
      if (!isPrivacyReady || !privacySdk || !signer || !provider) {
        toast.error("Privacy SDK is not ready. Please reconnect wallet.");
        return;
      }

      setIsPrivatePending(true);
      try {
        const tokenContract = new Contract(
          DEMO_CONTRACTS.ppUSD,
          [
            "function allowance(address owner, address spender) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
          ],
          signer,
        );

        const currentAllowance = (await tokenContract.getFunction("allowance")(
          address,
          DEMO_CONTRACTS.PrivacyProtocolPool,
        )) as bigint;

        if (currentAllowance < parsedAmount) {
          const approvalTx = await tokenContract.getFunction("approve")(
            DEMO_CONTRACTS.PrivacyProtocolPool,
            parsedAmount,
          );
          await approvalTx.wait();
        }

        const depositResult = await deposit({
          token: DEMO_CONTRACTS.ppUSD,
          amount: parsedAmount,
          metadata: { source: "defi" },
        });

        const depositDetails = await privacySdk
          .getPrivateTransactionDetails(depositResult.txHash)
          .catch(() => null);

        await logPrivateTransaction(
          depositResult.txHash,
          "deposit",
          `token=${DEMO_CONTRACTS.ppUSD}, amount=${parsedAmount.toString()}`,
          depositDetails,
          {
            noteCommitment: depositResult.commitment,
          },
        );

        const callData = swapInterface.encodeFunctionData("swap", [
          DEMO_CONTRACTS.ppUSD,
          parsedAmount,
          DEMO_CONTRACTS.USDTpp,
        ]);

        const executeResult = await executeAction({
          token: DEMO_CONTRACTS.ppUSD,
          amount: parsedAmount,
          target: DEMO_CONTRACTS.DemoDefi,
          data: callData,
          amountInPool: parsedAmount,
          secret: depositResult.secret,
          nullifier: depositResult.nullifier,
        });

        const executeDetails = await privacySdk
          .getPrivateTransactionDetails(executeResult.txHash)
          .catch(() => null);

        await logPrivateTransaction(
          executeResult.txHash,
          "executeAction(swap)",
          `amountIn=${amountIn}, tokenIn=ppUSD, tokenOut=USDTpp`,
          executeDetails,
          {
            proxyAddress: executeResult.proxyAddress,
            noteCommitment: executeResult.newCommitment,
          },
        );

        toast.success("Private swap successful!");
        setAmountIn("");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Private swap failed";
        toast.error(`Private swap failed: ${message}`);
      } finally {
        setIsPrivatePending(false);
      }

      return;
    }

    if (needsApproval) {
      setPendingTxType("approval");
      writeContract({
        address: DEMO_CONTRACTS.ppUSD,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [DEMO_CONTRACTS.DemoDefi, parsedAmount],
      });
    } else {
      setPendingTxType("swap");
      writeContract({
        address: DEMO_CONTRACTS.DemoDefi,
        abi: DEMO_DEFI_ABI,
        functionName: "swap",
        args: [parsedAmount],
      });
    }
  };

  const formattedBalanceIn = ppUSDBalance
    ? Number(formatEther(ppUSDBalance)).toFixed(2)
    : "0.00";
  const formattedBalanceOut = USDTppBalance
    ? Number(formatEther(USDTppBalance)).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-10">
      <Card className="mx-auto w-full max-w-lg border border-emerald-500/35 bg-transparent shadow-[0_0_0_1px_rgba(16,185,129,0.08),0_12px_28px_-22px_rgba(16,185,129,0.45)] backdrop-blur-xl dark:border-emerald-500/30 dark:bg-[radial-gradient(circle_at_top,#123223_0%,#070d0a_46%,#040806_100%)] dark:shadow-[0_0_0_1px_rgba(16,185,129,0.1),0_20px_40px_-28px_rgba(16,185,129,0.9)]">
        <CardHeader className="pb-4">
          <CardTitle className="text-emerald-900 dark:text-emerald-50">
            Swap Tokens
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 rounded-md">
          <div className="space-y-2 border border-emerald-500/35 bg-emerald-500/5 p-4 dark:border-emerald-500/30 dark:bg-[#06120d]">
            <div className="flex justify-between text-sm text-emerald-800/85 dark:text-emerald-100/70">
              <Label>Pay</Label>
              <span>Balance: {formattedBalanceIn}</span>
            </div>

            <div className="flex items-center gap-4">
              <Input
                className="h-10 w-full bg-transparent pl-2 text-2xl font-bold text-emerald-900 shadow-none placeholder:text-emerald-700/45 focus-visible:ring-0 dark:text-emerald-50 dark:placeholder:text-emerald-100/40"
                placeholder="0.0"
                value={amountIn}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAmountIn(e.target.value)
                }
              />

              <div className="flex w-[120px] items-center justify-center rounded-sm border border-emerald-500/45 bg-emerald-500/10 py-[10px] font-medium text-emerald-800 dark:border-emerald-500/35 dark:text-emerald-100">
                <span className="flex items-center gap-2">ppUSD</span>
              </div>
            </div>
            <div className="text-xs text-emerald-800/80 dark:text-emerald-100/65">
              ≈ ${amountIn || "0.00"}
            </div>
          </div>

          <div className="relative z-10 -my-2 flex items-center justify-center">
            <div className="rounded-xl border border-emerald-500/45 bg-emerald-500/5 p-2 text-emerald-800/85 dark:border-emerald-500/35 dark:bg-[#06120d] dark:text-emerald-100/80">
              <ArrowDown size={16} />
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-emerald-500/35 bg-emerald-500/5 p-4 dark:border-emerald-500/30 dark:bg-[#06120d]">
            <div className="flex justify-between text-sm text-emerald-800/85 dark:text-emerald-100/70">
              <Label>Receive</Label>
              <span>Balance: {formattedBalanceOut}</span>
            </div>
            <div className="flex items-center gap-4">
              <Input
                className="h-10 w-full bg-transparent p-0 pl-2 text-2xl font-bold text-emerald-900 shadow-none placeholder:text-emerald-700/45 focus-visible:ring-0 dark:text-emerald-50 dark:placeholder:text-emerald-100/40"
                placeholder="0.0"
                readOnly
                value={amountIn} // 1:1 swap for demo
              />
              <div className="flex w-[120px] items-center justify-center rounded-sm border border-emerald-500/45 bg-emerald-500/10 py-[10px] font-medium text-emerald-800 dark:border-emerald-500/35 dark:text-emerald-100">
                <span className="flex items-center gap-2">USDTpp</span>
              </div>
            </div>
            <div className="text-xs text-emerald-800/80 dark:text-emerald-100/65">
              ≈ ${amountIn || "0.00"}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm text-emerald-800/80 dark:text-emerald-100/65">
              <div className="flex items-center gap-1">
                <span>Privacy Fee</span>
                <Info size={12} />
              </div>
              <span>0% (Demo)</span>
            </div>
          </div>

          <Button
            className="mt-4 h-12 w-full border border-emerald-500/50 bg-emerald-500/15 text-lg font-semibold text-emerald-900 hover:bg-emerald-500/25 dark:border-emerald-300/45 dark:text-emerald-50"
            onClick={handleAction}
            disabled={isPending || !address || !amountIn}
          >
            {isIncognito ? (
              isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting private swap...
                </>
              ) : (
                "Swap Privately"
              )
            ) : isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {needsApproval ? "Approving..." : "Swapping..."}
              </>
            ) : needsApproval ? (
              "Approve and Swap ppUSD"
            ) : (
              "Swap"
            )}
          </Button>
        </CardContent>
      </Card>

      <Faucet />
    </div>
  );
}
