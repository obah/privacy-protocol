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
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { formatEther } from "viem";
import type { NormalTransactionReporter } from "./transaction-log-types";

type ProposalStatus = "Active" | "Passed" | "Failed" | "Executed" | "Closed";

const statusMap: Record<number, ProposalStatus> = {
  0: "Active",
  1: "Passed",
  2: "Failed",
  3: "Executed",
  4: "Closed",
};

interface DaoDemoContentProps {
  onNormalTransaction?: NormalTransactionReporter;
}

export default function DaoDemoContent({
  onNormalTransaction,
}: DaoDemoContentProps) {
  const { data: proposalCount } = useReadContract({
    address: DEMO_CONTRACTS.DemoDao,
    abi: DEMO_DAO_ABI,
    functionName: "getProposalCount",
    query: { refetchInterval: 5000 },
  });

  return (
    <div className="grid gap-6">
      <div className="space-y-6">
        {proposalCount && Number(proposalCount) > 0 ? (
          Array.from({ length: Number(proposalCount) }).map((_, i) => (
            <ProposalCard
              key={i + 1}
              id={i + 1}
              onNormalTransaction={onNormalTransaction}
            />
          ))
        ) : (
          <Card className="border border-emerald-500/35 bg-transparent shadow-[0_0_0_1px_rgba(16,185,129,0.08),0_12px_28px_-22px_rgba(16,185,129,0.45)] backdrop-blur-sm dark:border-emerald-500/30 dark:bg-[radial-gradient(circle_at_top,#123223_0%,#070d0a_46%,#040806_100%)] dark:shadow-[0_0_0_1px_rgba(16,185,129,0.1),0_20px_40px_-28px_rgba(16,185,129,0.9)]">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Info className="mb-4 h-12 w-12 text-emerald-700/80 dark:text-emerald-200/75" />
              <h3 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
                No Active Proposals
              </h3>
              <p className="mt-2 max-w-sm text-emerald-800/80 dark:text-emerald-100/70">
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

interface ProposalCardProps {
  id: number;
  onNormalTransaction?: NormalTransactionReporter;
}

function ProposalCard({ id, onNormalTransaction }: ProposalCardProps) {
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
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const [pendingVoteSupport, setPendingVoteSupport] = useState<number | null>(
    null,
  );
  const lastLoggedHashRef = useRef<`0x${string}` | null>(null);
  const isPending = isWritePending || isConfirming;

  useEffect(() => {
    if (isSuccess) {
      toast.success("Vote cast successfully!");
      refetchProposalData();
      refetchVoteData();
    }
    if (writeError) {
      toast.error(`Vote failed: ${writeError.message}`);
    }
  }, [isSuccess, writeError, refetchProposalData, refetchVoteData]);

  useEffect(() => {
    if (!hash || !onNormalTransaction || lastLoggedHashRef.current === hash) {
      return;
    }

    onNormalTransaction({
      hash,
      source: "dao",
      methodHint: "vote",
      parametersHint: `proposalId=${id}, support=${pendingVoteSupport ?? "unknown"}`,
      privacyLevel: "Public",
    });
    lastLoggedHashRef.current = hash;
  }, [hash, id, onNormalTransaction, pendingVoteSupport]);

  const handleVote = (support: number) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setPendingVoteSupport(support);
    writeContract({
      address: DEMO_CONTRACTS.DemoDao,
      abi: DEMO_DAO_ABI,
      functionName: "vote",
      args: [BigInt(id), support],
    });
  };

  if (!proposalData || !voteData) return null;

  const [, target, , , endTime, status] = proposalData;
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
      <Card className="border border-emerald-500/35 bg-transparent transition-colors shadow-[0_0_0_1px_rgba(16,185,129,0.08),0_12px_28px_-22px_rgba(16,185,129,0.45)] backdrop-blur-sm dark:border-emerald-500/30 dark:bg-[radial-gradient(circle_at_top,#123223_0%,#070d0a_46%,#040806_100%)] dark:shadow-[0_0_0_1px_rgba(16,185,129,0.1),0_20px_40px_-28px_rgba(16,185,129,0.9)]">
        <CardContent className="rounded-md border border-emerald-500/30 p-6 dark:border-emerald-400/30">
          <div className="flex flex-col justify-between gap-6 md:flex-row">
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        statusText === "Active"
                          ? "border-emerald-500/45 bg-emerald-500/10 text-emerald-800 dark:border-emerald-400/45 dark:bg-emerald-500/15 dark:text-emerald-200"
                          : statusText === "Passed"
                            ? "border-lime-500/45 bg-lime-500/10 text-lime-800 dark:border-lime-300/40 dark:bg-lime-400/10 dark:text-lime-100"
                            : "border-emerald-500/35 bg-emerald-500/5 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-400/5 dark:text-emerald-100/75",
                      )}
                    >
                      {statusText}
                    </span>

                    <span className="flex items-center gap-1 text-xs text-emerald-800/80 dark:text-emerald-100/65">
                      <Clock size={12} /> Ends{" "}
                      {new Date(Number(endTime) * 1000).toLocaleDateString()}
                    </span>

                    {address && ppUSDBalance !== undefined && (
                      <p className="rounded-md border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-100/85">
                        <span className="font-medium">Balance:</span>{" "}
                        {Number(formatEther(ppUSDBalance)).toFixed(2)} ppUSD
                      </p>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-emerald-900 dark:text-emerald-50">
                    {title}
                  </h3>
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-emerald-800/85 dark:text-emerald-100/75">
                {description}
              </p>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-200/90">
                  <ThumbsUp size={16} />
                  <span>{Number(forVotes)} For</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-rose-700 dark:text-rose-200/90">
                  <ThumbsDown size={16} />
                  <span>{Number(againstVotes)} Against</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-700/80 dark:text-emerald-100/65">
                  <MinusCircle size={16} />
                  <span>{Number(abstainVotes)} Abstain</span>
                </div>
              </div>
            </div>

            <div className="flex min-w-[140px] flex-col justify-center gap-3 border-t border-emerald-500/35 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6 dark:border-emerald-500/25">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-emerald-500/45 bg-emerald-500/10 text-emerald-800 hover:border-emerald-500/60 hover:bg-emerald-500/20 hover:text-emerald-900 disabled:opacity-50 dark:border-emerald-400/35 dark:text-emerald-100 dark:hover:border-emerald-300/60 dark:hover:text-emerald-50"
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
                className="w-full justify-start gap-2 border-rose-500/45 bg-rose-500/10 text-rose-700 hover:border-rose-500/60 hover:bg-rose-500/20 hover:text-rose-800 disabled:opacity-50 dark:border-rose-400/35 dark:text-rose-100 dark:hover:border-rose-300/60 dark:hover:text-rose-50"
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
                className="w-full justify-start gap-2 border-emerald-500/45 bg-emerald-500/10 text-emerald-800 hover:border-emerald-500/60 hover:bg-emerald-500/20 hover:text-emerald-900 disabled:opacity-50 dark:border-emerald-400/35 dark:text-emerald-100 dark:hover:border-emerald-300/60 dark:hover:text-emerald-50"
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
          <p className="text-sm text-emerald-800/80 dark:text-emerald-100/65">
            This is a demo, you can vote several times, claim more ppUSD below
            to vote more
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
