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
    <Card className="border-border/50 bg-background/40 mx-auto w-full max-w-lg shadow-2xl backdrop-blur-xl dark:border-green-100/50">
      <CardHeader>
        <CardTitle>Faucet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Connect wallet to claim tokens"
          className="h-12 w-full"
          value={address || ""}
          readOnly
        />
        <Button
          className="h-12 w-full"
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
