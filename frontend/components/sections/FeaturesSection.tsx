"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Code,
  Layers,
  Zap,
  Lock,
  RefreshCw,
  Coins,
} from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

// const features = [
//   {
//     icon: Shield,
//     title: "Zero-Knowledge Privacy",
//     description:
//       "Powered by Noir circuits and Aztec's bb.js, ensuring your transactions remain completely confidential.",
//   },
//   {
//     icon: Code,
//     title: "No Contract Changes",
//     description:
//       "Integrate privacy without modifying existing smart contracts. Works as a middleware layer.",
//   },
//   {
//     icon: Layers,
//     title: "EVM Compatible",
//     description:
//       "Deploy on any EVM-compatible chain. One SDK for Ethereum, Polygon, Arbitrum, and more.",
//   },
//   {
//     icon: Zap,
//     title: "Proxy Execution",
//     description:
//       "Actions execute through unique proxy contracts, breaking the link between deposits and actions.",
//   },
//   {
//     icon: Lock,
//     title: "Double-Spend Protection",
//     description:
//       "Nullifier-based system prevents double-spending while maintaining full privacy.",
//   },
//   {
//     icon: RefreshCw,
//     title: "UTXO Model",
//     description:
//       "Partial withdrawals create new commitments, allowing flexible fund management.",
//   },
// ];

const features = [
  {
    icon: Shield,
    title: "Client-Side Proving",
    description:
      "Proofs are generated entirely in the browser using Noir & bb.js, ensuring user secrets never leave their device.This maximizes security.",
  },
  {
    icon: Code,
    title: "Zero-Change Integration",
    description:
      "Plug-and-play middleware that works with your existing code. No need to rewrite your protocol's frontend/backend/smart contracts logic, drastically reducing development time and audit costs.",
  },
  // {
  //   icon: Layers,
  //   title: "Chain Agnostic",
  //   description:
  //     "Write once, deploy anywhere. Compatible with Ethereum, Arbitrum, Optimism, and any EVM-standard chain.",
  //   benefit:
  //     "Expands your dApp's addressable market to the entire EVM ecosystem without fragmentation.",
  // },
  {
    icon: Zap,
    title: "Relayer Execution",
    description:
      "Transactions are dispatched via ephemeral proxies, completely severing the link between the depositor and the action. Also protects non financial actions like voting etc.",
  },
  {
    icon: Lock,
    title: "Future-Proof Compliance",
    description:
      "Regulatory-friendly privacy layer that currently prevents double-spending via nullifiers. And coming soon - 'Proof of Innocence' and zk-KYC circuits to verify fund legitimacy without revealing identity.",
  },
  {
    icon: RefreshCw,
    title: "Liquid Privacy",
    description:
      "UTXO-based fund management allows for partial spends and fluid interaction, unlike rigid 'deposit-and-withdraw' mixers. Allows users spend just a portion of their shielded balance.",
  },
  {
    icon: Coins,
    title: "Smart Return Routing",
    description:
      "Automatically tracks and routes contract outputs (like winnings or swap results) back to the user's encrypted state, eliminating the need for manual 'claim' steps, giving users a seamless experience.",
  },
];

export function FeaturesSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Features
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-white">
            Everything you need to add privacy to your dApp, built with modern
            cryptography.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="border-border relative rounded-[1.25rem] border-[0.75px] p-2 md:rounded-[1.5rem] md:p-3"
            >
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <div className="bg-background relative flex h-full flex-col gap-6 overflow-hidden rounded-xl border-[0.75px] p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]">
                <div className="bg-primary/10 group-hover:bg-primary/20 mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors">
                  <feature.icon className="text-primary size-6" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-foreground mb-2 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
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
