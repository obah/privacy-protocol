"use client";

import { motion } from "framer-motion";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const steps = [
  {
    number: "01",
    title: "Shield Your Assets",
    description:
      "Deposit your tokens into the Privacy Pool. Your funds are secured, and you receive a private, encrypted 'note' that proves your ownership without revealing it.",
  },
  {
    number: "02",
    title: "Masked Interaction",
    description:
      "When you swap, trade, vote, bet or any other action, a Zero-Knowledge proof authorizes the move. The protocol assigns a fresh, temporary address to execute the action on your behalf.",
  },
  {
    number: "03",
    title: "Private Settlement",
    description:
      "Winnings or swapped tokens are tracked via that temporary address and automatically routed back to your private balance—completely untraceable to outsiders.",
  },
  {
    number: "04",
    title: "Anonymous Withdrawal",
    description:
      "Withdraw a portion or all of your funds to any wallet. The link between your original deposit and your exit is mathematically broken.",
  },
];

export function HowItWorksSectionUsers() {
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
            How It Works (For Users)
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-white">
            Privacy Protocol is the modular privacy layer for the EVM. Powered
            by zero-knowledge proofs, it enables developers to seamlessly
            integrate privacy into their existing and new dApps without
            sacrificing composability or breaking the UX of their dApps.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-zinc-800 p-2 md:rounded-[1.5rem] md:p-3">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                  variant="blue"
                />
                <div className="bg-background relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] border-cyan-500/20 p-6 shadow-sm md:p-6 dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]">
                  <div className="relative flex flex-1 flex-col justify-between gap-3">
                    <div className="text-cyan-500/20 mb-4 text-5xl font-bold">
                      {step.number}
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-foreground pt-0.5 font-sans text-xl leading-5.5 font-semibold tracking-[-0.04em] text-balance md:text-xl md:leading-6">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground font-sans text-sm leading-4.5 md:text-base md:leading-5.5 [&_b]:md:font-semibold [&_strong]:md:font-semibold">
                        {step.description}
                      </p>
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
