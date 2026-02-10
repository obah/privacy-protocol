"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useState } from "react";
import DaoDemoContent from "@/components/demo/DaoDemoContent";
import DefiDemoContent from "@/components/demo/DefiDemoContent";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Vote } from "lucide-react";

type DemoTab = "dao" | "defi";

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<DemoTab>("dao");

  const { theme, setTheme } = useTheme();

  const triggerIncognito = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const tabContent = {
    dao: {
      title: "Governance",
      description: `Vote on proposals ${
        theme === "dark" ? "privately through Privacy Protocol" : "publicly"
      }`,
      action: "vote",
      component: <DaoDemoContent />,
    },
    defi: {
      title: "DeFi Swap",
      description: `Swap tokens ${
        theme === "dark" ? "privately through Privacy Protocol" : "publicly"
      }`,
      action: "swap",
      component: <DefiDemoContent />,
    },
  };

  const currentTab = tabContent[activeTab];

  return (
    <main className="bg-background relative min-h-screen w-full overflow-x-hidden">
      <div className="border-primary mt-10 h-10 w-screen border-y"></div>
      <section className="relative z-10 container mx-auto flex items-start justify-between gap-10 px-4 pb-20">
        <div className="w-1/2">
          <div className="mt-2 mb-8 space-y-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("dao")}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all",
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
                  "flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all",
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
          <div className="mb-10 pt-6">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              {currentTab.title}
            </h1>
            <div className="space-y-1">
              <div className="flex gap-2">
                <p className="text-muted-foreground text-sm">
                  {currentTab.description}
                </p>
                <Button
                  variant={"link"}
                  className="text-primary h-auto p-0 underline"
                  onClick={triggerIncognito}
                >
                  {theme === "dark"
                    ? `Turn off incognito mode to ${currentTab.action} publicly`
                    : `Turn on incognito mode to ${currentTab.action} privately`}
                </Button>
              </div>
              <p className="text-muted-foreground text-sm">
                Claim tokens from the faucet below to get started.
              </p>
            </div>
          </div>
          <div className="min-h-[500px]">{currentTab.component}</div>
        </div>
        <div className="border-primary h-screen border"></div>
        <div className="w-1/2">
          <div className="mb-10 pt-6">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              Blockchain Explorer
            </h1>
            <p className="text-muted-foreground text-sm">
              Switch between normal and incognito mode to see the difference in
              the transaction logs.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
