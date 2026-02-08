"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Code, Layers, Zap, Lock, RefreshCw } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const features = [
  {
    icon: Shield,
    title: "Zero-Knowledge Privacy",
    description:
      "Powered by Noir circuits and Aztec's bb.js, ensuring your transactions remain completely confidential.",
  },
  {
    icon: Code,
    title: "No Contract Changes",
    description:
      "Integrate privacy without modifying existing smart contracts. Works as a middleware layer.",
  },
  {
    icon: Layers,
    title: "EVM Compatible",
    description:
      "Deploy on any EVM-compatible chain. One SDK for Ethereum, Polygon, Arbitrum, and more.",
  },
  {
    icon: Zap,
    title: "Proxy Execution",
    description:
      "Actions execute through unique proxy contracts, breaking the link between deposits and actions.",
  },
  {
    icon: Lock,
    title: "Double-Spend Protection",
    description:
      "Nullifier-based system prevents double-spending while maintaining full privacy.",
  },
  {
    icon: RefreshCw,
    title: "UTXO Model",
    description:
      "Partial withdrawals create new commitments, allowing flexible fund management.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Features
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to add privacy to your dApp, built with modern
            cryptography.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="relative rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3"
            >
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <div className="relative flex h-full flex-col gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="size-6 text-primary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
