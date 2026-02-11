"use client";

import { useEffect, useState } from "react";
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

export default function DefiDemoContent() {
  const { address } = useAccount();
  const [amountIn, setAmountIn] = useState("");
  const [pendingTxType, setPendingTxType] = useState<
    "approval" | "swap" | null
  >(null);

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

  const isPending = isWritePending || isConfirming;

  useEffect(() => {
    if (isSuccess && pendingTxType) {
      if (pendingTxType === "approval") {
        toast.success("Approval successful! Initiating swap...");
        refetchAllowance();
        setTimeout(() => {
          writeContract({
            address: DEMO_CONTRACTS.DemoDefi,
            abi: DEMO_DEFI_ABI,
            functionName: "swap",
            args: [parseEther(amountIn)],
          });
          setPendingTxType("swap");
        }, 1000);
      } else if (pendingTxType === "swap") {
        toast.success("Swap successful!");
        setAmountIn("");
        setPendingTxType(null);
      }
    }
    if (writeError) {
      toast.error(`Transaction failed: ${writeError.message}`);
      setPendingTxType(null);
    }
  }, [
    isSuccess,
    writeError,
    refetchAllowance,
    pendingTxType,
    amountIn,
    writeContract,
  ]);

  const handleAction = () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!amountIn || Number(amountIn) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (needsApproval) {
      writeContract({
        address: DEMO_CONTRACTS.ppUSD,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [DEMO_CONTRACTS.DemoDefi, parseEther(amountIn)],
      });
      setPendingTxType("approval");
    } else {
      writeContract({
        address: DEMO_CONTRACTS.DemoDefi,
        abi: DEMO_DEFI_ABI,
        functionName: "swap",
        args: [parseEther(amountIn)],
      });
      setPendingTxType("swap");
    }
  };

  const formattedBalanceIn = ppUSDBalance
    ? Number(formatEther(ppUSDBalance)).toFixed(2)
    : "0.00";
  const formattedBalanceOut = USDTppBalance
    ? Number(formatEther(USDTppBalance)).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-5">
      <Card className="border-border/50 bg-background/40 mx-auto w-full max-w-lg shadow-2xl backdrop-blur-xl dark:border-green-100/50">
        <CardHeader className="pb-4">
          <CardTitle>Swap Tokens</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 rounded-md">
          <div className="bg-background/50 border-border/50 space-y-2 border p-4">
            <div className="text-muted-foreground flex justify-between text-sm">
              <Label>Pay</Label>
              <span>Balance: {formattedBalanceIn}</span>
            </div>

            <div className="flex items-center gap-4">
              <Input
                className="placeholder:text-muted-foreground/50 h-10 w-full bg-transparent pl-2 text-2xl font-bold shadow-none focus-visible:ring-0"
                placeholder="0.0"
                value={amountIn}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAmountIn(e.target.value)
                }
              />

              <div className="bg-background/50 border-border/50 flex w-[120px] items-center justify-center rounded-sm border py-[10px] font-medium dark:border-green-100/50">
                <span className="flex items-center gap-2">ppUSD</span>
              </div>
            </div>
            <div className="text-muted-foreground text-xs">
              ≈ ${amountIn || "0.00"}
            </div>
          </div>

          <div className="relative z-10 -my-2 flex items-center justify-center">
            <div className="bg-background border-border/50 text-muted-foreground rounded-xl border p-2 dark:border-green-100/50">
              <ArrowDown size={16} />
            </div>
          </div>

          <div className="bg-background/50 border-border/50 space-y-2 rounded-xl border p-4">
            <div className="text-muted-foreground flex justify-between text-sm">
              <Label>Receive</Label>
              <span>Balance: {formattedBalanceOut}</span>
            </div>
            <div className="flex items-center gap-4">
              <Input
                className="placeholder:text-muted-foreground/50 h-10 w-full bg-transparent p-0 pl-2 text-2xl font-bold shadow-none focus-visible:ring-0"
                placeholder="0.0"
                readOnly
                value={amountIn} // 1:1 swap for demo
              />
              <div className="bg-background/50 border-border/50 flex w-[120px] items-center justify-center rounded-sm border py-[10px] font-medium dark:border-green-100/50">
                <span className="flex items-center gap-2">USDTpp</span>
              </div>
            </div>
            <div className="text-muted-foreground text-xs">
              ≈ ${amountIn || "0.00"}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-muted-foreground flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <span>Privacy Fee</span>
                <Info size={12} />
              </div>
              <span>0% (Demo)</span>
            </div>
          </div>

          <Button
            className="mt-4 h-12 w-full text-lg font-semibold"
            onClick={handleAction}
            disabled={isPending || !address || !amountIn}
          >
            {isPending ? (
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
