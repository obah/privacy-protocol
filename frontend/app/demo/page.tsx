"use client";

import { useState } from "react";
import DemoWrapper from "@/components/demo/DemoWrapper";
import DaoDemoContent from "@/components/demo/DaoDemoContent";
import DefiDemoContent from "@/components/demo/DefiDemoContent";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Vote } from "lucide-react";

type DemoTab = "dao" | "defi";

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<DemoTab>("dao");

  const tabContent = {
    dao: {
      title: "Governance",
      description: "Participate in the DAO and vote on proposals privately.",
      action: "vote",
      component: <DaoDemoContent />,
    },
    defi: {
      title: "DeFi Swap",
      description: "Swap tokens privately using the privacy protocol.",
      action: "swap",
      component: <DefiDemoContent />,
    },
  };

  const currentTab = tabContent[activeTab];

  return (
    <DemoWrapper
      title={currentTab.title}
      description={currentTab.description}
      action={currentTab.action}
    >
      <div className="mb-8 space-y-4">
        <label className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
          Demo Type
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("dao")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all",
              activeTab === "dao"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/50 bg-background/50 hover:border-primary/50 text-muted-foreground hover:bg-background/80",
            )}
          >
            <Vote size={18} />
            Governance
          </button>
          <button
            onClick={() => setActiveTab("defi")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all",
              activeTab === "defi"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/50 bg-background/50 hover:border-primary/50 text-muted-foreground hover:bg-background/80",
            )}
          >
            <LayoutDashboard size={18} />
            DeFi
          </button>
        </div>
      </div>

      <div className="min-h-[500px]">{currentTab.component}</div>
    </DemoWrapper>
  );
}
