"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Eye, EyeOff, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const { theme, setTheme } = useTheme();
  // const [mounted, setMounted] = useState(false);

  // useEffect(() => {
  //   setMounted(true);
  // }, []);

  // if (!mounted) return null;

  const isIncognito = theme === "dark";

  const toggleIncognito = () => {
    setTheme(isIncognito ? "light" : "dark");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-background/50 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg">P</span>
        </div>
        <span className="text-lg font-semibold tracking-tight">
          Privacy Protocol
        </span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link
          href="/docs"
          className="text-sm font-medium hover:text-primary transition-colors"
        >
          Docs
        </Link>
        <Link
          href="/demo"
          className="text-sm font-medium hover:text-primary transition-colors"
        >
          Demo
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleIncognito}
          className={cn(
            "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border overflow-hidden group",
            isIncognito
              ? "bg-black/20 border-transparent text-primary"
              : "bg-white/50 border-gray-200 text-gray-700 hover:border-gray-300",
          )}
        >
          {isIncognito && (
            <div className="absolute inset-0 bg-primary/10 animate-pulse pointer-events-none" />
          )}

          <div className="relative z-10 flex items-center gap-2">
            {isIncognito ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{isIncognito ? "Incognito On" : "Incognito Off"}</span>
          </div>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background font-medium text-sm hover:opacity-90 transition-opacity">
          <Wallet size={16} />
          <span>Connect</span>
        </button>
      </div>
    </nav>
  );
};
