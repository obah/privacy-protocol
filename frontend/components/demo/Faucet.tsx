"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { DEMO_CONTRACTS, DEMO_DEFI_ABI } from "@/lib/demo-config";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function Faucet() {
  const { address } = useAccount();
  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success("Tokens claimed successfully!");
    }
    if (writeError) {
      toast.error(`Failed to claim tokens: ${writeError.message}`);
    }
  }, [isSuccess, writeError]);

  const handleClaim = () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    writeContract({
      address: DEMO_CONTRACTS.DemoDefi,
      abi: DEMO_DEFI_ABI,
      functionName: "faucet",
    });
  };

  const isPending = isWritePending || isConfirming;

  return (
    <Card className="mx-auto w-full max-w-lg border border-sky-500/35 bg-transparent shadow-[0_0_0_1px_rgba(56,189,248,0.1),0_12px_28px_-22px_rgba(56,189,248,0.4)] backdrop-blur-xl dark:border-sky-400/30 dark:bg-[radial-gradient(circle_at_top,#182b44_0%,#0a101a_46%,#060a12_100%)] dark:shadow-[0_0_0_1px_rgba(56,189,248,0.12),0_20px_40px_-28px_rgba(56,189,248,0.9)]">
      <CardHeader>
        <CardTitle className="text-sky-900 dark:text-sky-50">Faucet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Connect wallet to claim tokens"
          className="h-12 w-full border-sky-500/45 bg-sky-500/5 text-sky-900 placeholder:text-sky-700/45 dark:border-sky-400/35 dark:text-sky-50 dark:placeholder:text-sky-100/45"
          value={address || ""}
          readOnly
        />
        <Button
          className="h-12 w-full border border-emerald-500/50 bg-emerald-500/15 text-emerald-900 hover:bg-emerald-500/25 dark:border-emerald-300/45 dark:text-emerald-50"
          onClick={handleClaim}
          disabled={isPending || !address}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Claiming...
            </>
          ) : (
            "Claim 1000 ppUSD"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
