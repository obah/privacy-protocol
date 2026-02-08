"use client";

import { motion } from "framer-motion";
import { ArrowRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import { AuroraBackground } from "./ui/aurora-background";

export const HeroSection = () => {
  const [copied, setCopied] = useState(false);
  const command = "npm i privacy-protocol";

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AuroraBackground>
      <motion.section
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden"
      >
        <div className="container z-10 flex flex-col items-center gap-8 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-b from-white to-foreground">
              Privacy Protocol
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto">
              The privacy middleware layer for the decentralized web.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative group cursor-pointer rounded-xl overflow-hidden bg-background border border-white/10"
            onClick={handleCopy}
          >
            <div className="relative flex items-center gap-4 px-6 py-4 backdrop-blur-xl z-10">
              <span className="font-mono text-lg text-white">{command}</span>
              <div className="text-muted-foreground">
                {copied ? (
                  <Check size={18} className="text-green-500" />
                ) : (
                  <Copy size={18} />
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <button className="group relative px-8 py-3 bg-foreground text-background rounded-full font-semibold text-lg hover:opacity-90 transition-all flex items-center gap-2">
              Get Started
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </motion.div>
        </div>
      </motion.section>
    </AuroraBackground>
  );
};
