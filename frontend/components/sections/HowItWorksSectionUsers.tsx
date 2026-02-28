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
    <section className="relative px-6 py-24">
      <div className="bg-primary/5 from-primary/10 via-background to-background pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))]" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="neon-text text-primary mb-4 text-3xl font-bold tracking-widest uppercase sm:text-4xl">
            How It Works (For Users)
          </h2>
          <p className="text-primary/70 mx-auto mt-4 max-w-3xl font-mono text-sm tracking-wide text-balance md:text-base">
            Created with your user's experience in mind. Privacy Protocol acts
            as an invisible shield over your existing workflow. Instead of
            navigating complex mixers or fragmented Layer 2s, users can interact
            with their favorite dApps with the same speed and ease they are used
            to, all while their identity and actions remain mathematically
            private.
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
              className="group relative"
            >
              <div className="border-primary/20 group-hover:border-primary/50 relative h-full rounded-xl border bg-black/40 p-2 transition-all duration-300 group-hover:bg-black/60 md:p-3">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                  variant="blue"
                />
                <div className="bg-background border-primary/20 group-hover:bg-primary/5 group-hover:border-primary/40 relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-lg border p-6 shadow-sm transition-colors duration-300 md:p-6">
                  <div className="relative flex flex-1 flex-col justify-between gap-3">
                    <div className="neon-text mb-4 font-mono text-5xl font-bold text-cyan-500 opacity-70 transition-opacity duration-300 group-hover:opacity-100">
                      {step.number}
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-primary/90 pt-0.5 font-sans text-xl leading-5.5 font-bold tracking-wide uppercase md:text-xl md:leading-6">
                        {step.title}
                      </h3>
                      <p className="text-primary/60 group-hover:text-primary/80 font-mono text-sm leading-relaxed transition-colors duration-300 md:text-base">
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
