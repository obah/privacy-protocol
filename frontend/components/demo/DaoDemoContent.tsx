"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Clock,
  Loader2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Faucet from "./Faucet";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { DEMO_CONTRACTS, DEMO_DAO_ABI, ERC20_ABI } from "@/lib/demo-config";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatEther } from "viem";

type ProposalStatus = "Active" | "Passed" | "Failed" | "Executed" | "Closed";

interface Proposal {
  id: number;
  proposer: string;
  target: string;
  value: bigint;
  startTime: bigint;
  endTime: bigint;
  status: number;
  executed: boolean;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  hasVoted: boolean;
}

const statusMap: Record<number, ProposalStatus> = {
  0: "Active",
  1: "Passed",
  2: "Failed",
  3: "Executed",
  4: "Closed",
};

export default function DaoDemoContent() {
  const { data: proposalCount } = useReadContract({
    address: DEMO_CONTRACTS.DemoDao,
    abi: DEMO_DAO_ABI,
    functionName: "getProposalCount",
    query: { refetchInterval: 5000 },
  });

  const {
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const isPending = isWritePending || isConfirming;

  useEffect(() => {
    if (isSuccess) {
      toast.success("Vote cast successfully!");
    }
    if (writeError) {
      toast.error(`Vote failed: ${writeError.message}`);
    }
  }, [isSuccess, writeError]);

  return (
    <div className="grid gap-6">
      <div className="space-y-6">
        {proposalCount && Number(proposalCount) > 0 ? (
          Array.from({ length: Number(proposalCount) }).map((_, i) => (
            <ProposalCard key={i + 1} id={i + 1} />
          ))
        ) : (
          <Card className="border-border/50 bg-background/40 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Info className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-xl font-semibold">No Active Proposals</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                There are currently no proposals in the DAO.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="mt-8">
        <Faucet />
      </div>
    </div>
  );
}

function ProposalCard({ id }: { id: number }) {
  const { address } = useAccount();
  const { data: proposalData, refetch: refetchProposalData } = useReadContract({
    address: DEMO_CONTRACTS.DemoDao,
    abi: DEMO_DAO_ABI,
    functionName: "s_proposals",
    args: [BigInt(id)],
    query: { refetchInterval: 3000 },
  });

  const { data: voteData, refetch: refetchVoteData } = useReadContract({
    address: DEMO_CONTRACTS.DemoDao,
    abi: DEMO_DAO_ABI,
    functionName: "s_proposalVotes",
    args: [BigInt(id)],
    query: { refetchInterval: 3000 },
  });

  const { data: hasVoted } = useReadContract({
    address: DEMO_CONTRACTS.DemoDao,
    abi: DEMO_DAO_ABI,
    functionName: "hasVoted",
    args: [BigInt(id), address || "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address },
  });

  const { data: ppUSDBalance } = useReadContract({
    address: DEMO_CONTRACTS.ppUSD,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address, refetchInterval: 3000 },
  });

  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const isPending = isWritePending || isConfirming;

  useEffect(() => {
    if (isSuccess) {
      toast.success("Vote cast successfully!");
      // Refetch vote data immediately after successful vote
      refetchProposalData();
      refetchVoteData();
    }
  }, [isSuccess, refetchProposalData, refetchVoteData]);

  const handleVote = (support: number) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }
    writeContract({
      address: DEMO_CONTRACTS.DemoDao,
      abi: DEMO_DAO_ABI,
      functionName: "vote",
      args: [BigInt(id), support],
    });
  };

  if (!proposalData || !voteData) return null;

  const [proposer, target, value, startTime, endTime, status, executed] =
    proposalData;
  const [forVotes, againstVotes, abstainVotes] = voteData;

  const statusText = statusMap[status] || "Unknown";
  const title = `Proposal #${id}`;
  const description = `Execute call to ${target.slice(0, 6)}...${target.slice(-4)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50 bg-background/40 hover:bg-background/60 backdrop-blur-sm transition-colors">
        <CardContent className="rounded-md border border-green-200 p-6 dark:border-blue-200/50">
          <div className="flex flex-col justify-between gap-6 md:flex-row">
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        statusText === "Active"
                          ? "border-blue-400/20 bg-blue-400/10 text-blue-400"
                          : statusText === "Passed"
                            ? "border-green-400/20 bg-green-400/10 text-green-400"
                            : "border-zinc-400/20 bg-zinc-400/10 text-zinc-400",
                      )}
                    >
                      {statusText}
                    </span>

                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Clock size={12} /> Ends{" "}
                      {new Date(Number(endTime) * 1000).toLocaleDateString()}
                    </span>

                    {address && ppUSDBalance !== undefined && (
                      <p className="text-muted-foreground rounded-md border border-blue-200/30 bg-blue-50/50 px-3 py-2 text-xs dark:border-blue-400/30 dark:bg-blue-950/30">
                        <span className="font-medium">Balance:</span>{" "}
                        {Number(formatEther(ppUSDBalance)).toFixed(2)} ppUSD
                      </p>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold">{title}</h3>
                </div>
              </div>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {description}
              </p>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2 text-sm text-green-500/80">
                  <ThumbsUp size={16} />
                  <span>{Number(forVotes)} For</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-red-500/80">
                  <ThumbsDown size={16} />
                  <span>{Number(againstVotes)} Against</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <MinusCircle size={16} />
                  <span>{Number(abstainVotes)} Abstain</span>
                </div>
              </div>
            </div>

            <div className="border-border/50 flex min-w-[140px] flex-col justify-center gap-3 border-t pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 hover:border-green-500/50 hover:bg-green-500/10 hover:text-green-500 disabled:opacity-50"
                onClick={() => handleVote(1)}
                disabled={isPending || statusText !== "Active"}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsUp size={16} />
                )}
                Vote For
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                onClick={() => handleVote(0)}
                disabled={isPending || statusText !== "Active"}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsDown size={16} />
                )}
                Vote Against
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 disabled:opacity-50"
                onClick={() => handleVote(2)}
                disabled={isPending || statusText !== "Active"}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MinusCircle size={16} />
                )}
                Abstain
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-sm">
            This is a demo, you can vote several times, claim more ppUSD below
            to vote more
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
