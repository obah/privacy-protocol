"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "./ui/button";

export const Navbar = () => {
  return (
    <nav className="bg-background/50 fixed top-0 right-0 left-0 z-50 px-8 py-5 backdrop-blur-xl">
      <div className="flex items-center justify-between rounded-sm border border-white/10">
        <div className="flex items-center gap-2">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-primary-foreground text-lg font-bold">P</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Privacy Protocol
          </span>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="https://privacy-protocol.gitbook.io/privacy-protocol-docs"
            target="_blank"
            className="hover:text-primary rounded-sm px-4 py-2 text-sm font-medium backdrop-blur-xs transition-colors"
          >
            Docs
          </Link>
          <Link
            href="/demo"
            className="hover:text-primary rounded-sm px-4 py-2 text-sm font-medium backdrop-blur-xs transition-colors"
          >
            Demo
          </Link>
        </div>

        <Link
          href="/demo"
          className={buttonVariants({ size: "lg", className: "h-11 px-7" })}
        >
          Try it now <ArrowRight size={16} />
        </Link>
      </div>
    </nav>
  );
};
