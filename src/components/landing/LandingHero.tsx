import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function LandingHero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -20%, hsl(var(--primary) / 0.12), transparent 70%)," +
            "radial-gradient(ellipse 60% 40% at 80% 20%, hsl(var(--primary) / 0.06), transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 pt-28 pb-20 sm:px-8 lg:px-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex max-w-3xl flex-col items-center text-center"
        >
          <motion.div variants={item}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <ShieldCheck className="h-4 w-4" />
              Local-first finance tracking
            </div>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            Take control of your{" "}
            <span className="text-primary">money</span>
            {" "}with clarity and calm.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-4 max-w-xl text-lg text-muted-foreground sm:text-xl"
          >
            Track budgets, goals, debts, and accounts in one responsive workspace
            designed for everyday financial decisions.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="gap-2 rounded-full px-8">
              <Link to="/dashboard">
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8">
              <Link to="/transactions">View Transactions</Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-16 w-full max-w-5xl"
        >
          <div className="relative rounded-2xl border border-border/60 bg-card/50 p-2 shadow-elevated backdrop-blur-sm">
            <div className="absolute -top-3 left-6 flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <div className="overflow-hidden rounded-xl border border-border/40 bg-background">
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="grid h-6 w-6 place-items-center rounded bg-primary/10">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Kobo Dashboard</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden text-xs text-muted-foreground/60 sm:inline">Last 30 days</span>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    +₦245K net
                  </span>
                </div>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Income</p>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">₦1.8M</p>
                  <div className="mt-2 h-1.5 rounded-full bg-border/60">
                    <div className="h-1.5 w-[72%] rounded-full bg-emerald-500" />
                  </div>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Expenses</p>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">₦1.2M</p>
                  <div className="mt-2 h-1.5 rounded-full bg-border/60">
                    <div className="h-1.5 w-[58%] rounded-full bg-rose-500" />
                  </div>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Savings</p>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">₦850K</p>
                  <div className="mt-2 h-1.5 rounded-full bg-border/60">
                    <div className="h-1.5 w-[64%] rounded-full bg-sky-500" />
                  </div>
                </div>
              </div>
              <div className="border-t border-border/40 px-4 py-2">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Sample dashboard data — your real numbers will appear here
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
