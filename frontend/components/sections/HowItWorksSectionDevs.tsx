"use client";

import { motion } from "framer-motion";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const steps = [
  {
    number: "01",
    title: "Install and Enable",
    description:
      "Install the SDK to wrap standard wallets. Enable shielded transactions with zero changes to your backend logic.",
  },
  {
    number: "02",
    title: "Client-Side Proving",
    description:
      "The SDK abstracts ZK complexity, generating local proofs to authorize intents without revealing the signer's identity.",
  },
  {
    number: "03",
    title: "Relayed Execution",
    description:
      "Proofs are verified on-chain. The protocol executes calls to your contract via a fresh, ephemeral proxy.",
  },
  {
    number: "04",
    title: "Composable Settlement",
    description:
      "Execute standard logic (mint, swap, vote etc.). Outputs are automatically routed back to the user's shielded balance.",
  },
];

export function HowItWorksSectionDevs() {
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
            How It Works (For Developers)
          </h2>
          <p className="text-primary/70 mx-auto mt-4 max-w-3xl font-mono text-sm tracking-wide text-balance md:text-base">
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
              className="group relative"
            >
              {/* {index < steps.length - 1 && (
                <div className="from-border absolute top-8 left-full z-0 hidden h-px w-full bg-linear-to-r to-transparent lg:block" />
              )} */}

              <div className="border-primary/20 group-hover:border-primary/50 relative h-full rounded-xl border bg-black/40 p-2 transition-all duration-300 group-hover:bg-black/60 md:p-3">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="bg-background border-primary/20 group-hover:bg-primary/5 group-hover:border-primary/40 relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-lg border p-6 shadow-sm transition-colors duration-300 md:p-6">
                  <div className="relative flex flex-1 flex-col justify-between gap-3">
                    <div className="neon-text mb-4 font-mono text-5xl font-bold opacity-70 transition-opacity duration-300 group-hover:opacity-100">
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
