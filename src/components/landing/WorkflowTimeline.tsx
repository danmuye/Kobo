import { motion } from "framer-motion";
import { ArrowDown, Wallet2, BarChart3, Target, Landmark, TrendingUp, FileText } from "lucide-react";

interface Step {
  icon: typeof Wallet2;
  label: string;
  description: string;
}

const steps: Step[] = [
  { icon: Wallet2, label: "Income", description: "Record your earnings from any source." },
  { icon: BarChart3, label: "Transactions", description: "Every expense and transfer is captured." },
  { icon: Target, label: "Budgets", description: "Allocate funds and track against limits." },
  { icon: PiggyBank, label: "Savings Goals", description: "Set targets and watch your progress grow." },
  { icon: Landmark, label: "Debt Payments", description: "Manage repayments on a clear timeline." },
  { icon: TrendingUp, label: "Analytics", description: "Understand patterns with visual reports." },
  { icon: FileText, label: "Reports", description: "Export insights for any period." },
];

function PiggyBank(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.4-1 1.4-1.8" />
      <path d="M21 8.5c-.5-.5-1.2-.5-1.7 0l-1.5 1.5" />
      <circle cx="8" cy="12" r=".5" />
    </svg>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const stepItem = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

export default function WorkflowTimeline() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, hsl(var(--primary) / 0.05), transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            How Kobo Works
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            From income to insight — your financial workflow, visualized.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-16 flex flex-col items-center"
        >
          <div className="relative flex flex-col items-center">
            <div
              className="pointer-events-none absolute top-0 bottom-0 left-[23px] w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent"
              aria-hidden="true"
            />

            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.label}
                  variants={stepItem}
                  className="relative flex w-full max-w-lg items-start gap-5 pb-12 last:pb-0"
                >
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card shadow-sm">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 pt-1.5">
                    <h3 className="text-base font-semibold text-foreground">{step.label}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="absolute -bottom-3 left-[22px] z-10 flex h-6 w-6 items-center justify-center">
                      <ArrowDown className="h-4 w-4 text-primary/40" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
