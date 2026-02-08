"use client";

import React from "react";
import { motion } from "framer-motion";
import { Terminal, Key, Zap } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const steps = [
  {
    icon: Terminal,
    title: "Install the SDK",
    code: `npm install privacy-protocol`,
    description:
      "Add the Privacy Protocol SDK to your project with a single command.",
  },
  {
    icon: Key,
    title: "Initialize & Deposit",
    code: `const sdk = new PrivacyProtocolSDK(provider, contractAddress, circuit);

const { secret, nullifier, commitment } = await sdk.deposit(
  tokenAddress,
  amount,
  signer
);`,
    description:
      "Create a privacy pool instance and deposit tokens to receive your secret keys.",
  },
  {
    icon: Zap,
    title: "Execute Private Actions",
    code: `const { txHash, proxyAddress } = await sdk.executeAction(
  tokenAddress,
  amount,
  targetContract,
  callData,
  actionId,
  secret,
  nullifier,
  totalAmount,
  leaves,
  signer
);`,
    description:
      "Interact with any dApp privately through the SDK's action executor.",
  },
];

export function HowToUseSection() {
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
            Quick Start Guide
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get privacy-enabled in minutes with just a few lines of code.
          </p>
        </motion.div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3"
            >
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Step info */}
                  <div className="lg:w-1/3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <step.icon className="size-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-primary">
                        Step {index + 1}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>
                  </div>

                  {/* Code block */}
                  <div className="lg:w-2/3">
                    <div className="bg-foreground/5 dark:bg-white/5 rounded-xl p-4 overflow-x-auto">
                      <pre className="text-sm font-mono text-foreground/80">
                        <code>{step.code}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
