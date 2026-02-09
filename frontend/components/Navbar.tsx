"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button, buttonVariants } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";
import { ConnectKitButton } from "connectkit";
import { useState } from "react";
import { useTheme } from "next-themes";

export const Navbar = () => {
  const { setTheme, theme } = useTheme();

  const pathname = usePathname();
  const isDemo = pathname.includes("/demo");

  const triggerIncognito = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isIncognito = theme === "dark";

  return (
    <nav className="bg-background/50 fixed top-0 right-0 left-0 z-50 px-8 py-5 backdrop-blur-xl">
      <div className="flex items-center justify-between rounded-sm border border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-primary-foreground text-lg font-bold">P</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Privacy Protocol
          </span>
        </Link>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="https://privacy-protocol.gitbook.io/privacy-protocol-docs"
            target="_blank"
            className="hover:text-primary rounded-sm px-4 py-2 text-sm font-medium backdrop-blur-xs transition-colors"
          >
            Docs
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="hover:text-primary flex items-center gap-1 rounded-sm px-4 py-2 text-sm font-medium backdrop-blur-xs transition-colors outline-none">
              Demo <ChevronDown size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/demo/dao">DAO Demo</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/demo/defi">DeFi Demo</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isDemo ? (
          <div className="flex items-center gap-2">
            <Button
              variant={isIncognito ? "secondary" : "outline"}
              onClick={triggerIncognito}
            >
              {isIncognito ? "Incognito on" : "Incognito off"}
            </Button>
            <ConnectKitButton.Custom>
              {({ isConnected, show, truncatedAddress, ensName }) => (
                <Button size={"lg"} onClick={show} className="h-11 px-7">
                  {isConnected
                    ? (ensName ?? truncatedAddress)
                    : "Connect Wallet"}
                </Button>
              )}
            </ConnectKitButton.Custom>
          </div>
        ) : (
          <Link
            href="/demo/dao"
            className={buttonVariants({ size: "lg", className: "h-11 px-7" })}
          >
            Try it now <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </nav>
  );
};
