"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "./ui/button";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50  px-8 py-5  bg-background/50 backdrop-blur-xl">
      <div className="flex items-center justify-between border border-white/10 rounded-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">P</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Privacy Protocol
          </span>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/docs"
            className="text-sm font-medium hover:text-primary transition-colors backdrop-blur-xs rounded-sm px-4 py-2"
          >
            Docs
          </Link>
          <Link
            href="/demo"
            className="text-sm font-medium hover:text-primary transition-colors backdrop-blur-xs rounded-sm px-4 py-2"
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
