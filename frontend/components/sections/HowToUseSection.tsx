"use client";

import { motion } from "framer-motion";
import { Terminal, Settings, Zap } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const steps = [
  {
    icon: Terminal,
    title: "Install the SDK",
    code: `npm i privacy-protocol ethers`,
    description: "Install the SDK and core dependencies to get started.",
  },
  {
    icon: Settings,
    title: "Set up SDK",
    code: `import { useDeposit, useExecuteAction } from "privacy-protocol/hooks";

const config = {
  poolAddress,
  provider,
  signer,
};`,
    description:
      "Initialize with provider and pool address. Relayer transport is resolved by default.",
  },
  {
    icon: Zap,
    title: "Use Hooks",
    code: `const [privateTxHash, setPrivateTxHash] = useState<string>();
const { deposit } = useDeposit(config);
const { executeAction } = useExecuteAction(config);
const { data: details } = usePrivateTransactionDetails({
  ...config,
  txHash: privateTxHash,
});

const depositResult = await deposit({ token, amount });
const result = await executeAction({
  token,
  amount,
  target,
  data,
  secret: depositResult.secret,
  nullifier: depositResult.nullifier,
  amountInPool: amount,
});
setPrivateTxHash(result.txHash);`,
    description:
      "Deposit funds and execute private actions. Relay lifecycle resolves from queued to submitted to confirmed.",
  },
];

export function HowToUseSection() {
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
            Quick Start Guide
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-white">
            Get your dApp privacy-enabled in minutes with just a few lines of
            code.
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
              className="border-border relative h-full rounded-[1.25rem] border-[0.75px] p-2 md:rounded-[1.5rem] md:p-3"
            >
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <div className="bg-background relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] p-6 shadow-sm md:p-6 dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]">
                <div className="flex flex-col gap-6 lg:flex-row">
                  <div className="lg:w-1/3">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                        <step.icon className="text-primary size-5" />
                      </div>
                      <span className="text-primary text-sm font-medium">
                        Step {index + 1}
                      </span>
                    </div>
                    <h3 className="text-foreground mb-2 text-xl font-semibold">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>
                  </div>

                  <div className="lg:w-2/3">
                    <div className="bg-foreground/5 overflow-x-auto rounded-xl p-4 dark:bg-white/5">
                      <pre className="text-foreground/80 font-mono text-sm">
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
