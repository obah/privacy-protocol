"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, MinusCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Faucet from "./Faucet";

type ProposalStatus = "Active" | "Passed" | "Failed" | "Executed";

interface Proposal {
  id: number;
  title: string;
  description: string;
  status: ProposalStatus;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  endTime: string;
  proposer: string;
}

const mockProposals: Proposal[] = [
  {
    id: 1,
    title: "Add ETH-USDC Pool to Privacy Shield",
    description:
      "Proposal to whitelist the ETH-USDC Uniswap V3 pool for private interaction via the protocol.",
    status: "Active",
    forVotes: 15400,
    againstVotes: 2300,
    abstainVotes: 500,
    endTime: "2024-03-20T12:00:00Z",
    proposer: "0x1234...5678",
  },
];

export default function DaoDemoContent() {
  return (
    <div className="grid gap-6">
      <div className="space-y-6">
        {mockProposals.map((proposal) => (
          <motion.div
            key={proposal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border/50 bg-background/40 hover:bg-background/60 backdrop-blur-sm transition-colors">
              <CardContent className="rounded-md border border-green-200 p-6 dark:border-blue-200">
                <div className="flex flex-col justify-between gap-6 md:flex-row">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-0.5 text-xs font-medium text-blue-400",
                            )}
                          >
                            {proposal.status}
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Clock size={12} /> Ends{" "}
                            {new Date(proposal.endTime).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold">
                          {proposal.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {proposal.description}
                    </p>

                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-2 text-sm text-green-500/80">
                        <ThumbsUp size={16} />
                        <span>
                          {(proposal.forVotes / 1000).toFixed(1)}k For
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-red-500/80">
                        <ThumbsDown size={16} />
                        <span>
                          {(proposal.againstVotes / 1000).toFixed(1)}k Against
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <MinusCircle size={16} />
                        <span>
                          {(proposal.abstainVotes / 1000).toFixed(1)}k Abstain
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-border/50 flex min-w-[140px] flex-col justify-center gap-3 border-t pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 hover:border-green-500/50 hover:bg-green-500/10 hover:text-green-500"
                    >
                      <ThumbsUp size={16} /> Vote For
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
                    >
                      <ThumbsDown size={16} /> Vote Against
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <MinusCircle size={16} /> Abstain
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <div className="mt-8">
        <Faucet />
      </div>
    </div>
  );
}
