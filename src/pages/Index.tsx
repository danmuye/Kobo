import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Landmark, ShieldCheck, Target, Wallet2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/format";

const highlights = [
  {
    title: "Full money visibility",
    description: "Track balances, cash flow, and recurring activity from a single calm workspace.",
    icon: Wallet2,
  },
  {
    title: "Budget with confidence",
    description: "Set spending limits, monitor progress, and stay ahead of month-end surprises.",
    icon: BarChart3,
  },
  {
    title: "Plan for what matters",
    description: "Build savings goals, manage debt payments, and keep long-term decisions visible.",
    icon: Target,
  },
];

const pillars = [
  { label: "Accounts", value: "5 live accounts" },
  { label: "Budgets", value: "8 active categories" },
  { label: "Goals", value: "4 milestones" },
  { label: "Debt", value: "3 obligations" },
];

export default function Index() {
  return (
    <div
      className="min-h-screen bg-background"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(16, 185, 129, 0.16), transparent 34%), linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--secondary) / 0.8) 100%)",
      }}
    >
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between rounded-full border border-border/70 bg-background/70 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <Wallet2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Kobo</p>
              <p className="text-xs text-muted-foreground">Personal Finance Manager</p>
            </div>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/dashboard">Open Dashboard</Link>
          </Button>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              Local-first, beautifully organized finance tracking
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Take control of your money with clarity and calm.
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                Track budgets, goals, debts and accounts in one responsive workspace designed for everyday decisions.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link to="/dashboard">
                  Open Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/transactions">Review transactions</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {pillars.map((item) => (
                <div key={item.label} className="rounded-xl border border-border/70 bg-card/80 px-3 py-3 shadow-sm">
                  <p className="text-sm font-semibold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-elegant backdrop-blur"
          >
            <div className="rounded-2xl border border-border/70 bg-background/90 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">This month at a glance</p>
                  <p className="text-xs text-muted-foreground">A realistic snapshot powered by your sample data.</p>
                </div>
                <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  +12.4% saved
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/60 bg-secondary/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Income</span>
                    <span className="text-sm font-semibold text-foreground">{formatNaira(1_400_000, { compact: true })}</span>
                  </div>
                  <div className="h-2 rounded-full bg-background">
                    <div className="h-2 w-[78%] rounded-full bg-emerald-500" />
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-secondary/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Expenses</span>
                    <span className="text-sm font-semibold text-foreground">{formatNaira(1_100_000, { compact: true })}</span>
                  </div>
                  <div className="h-2 rounded-full bg-background">
                    <div className="h-2 w-[64%] rounded-full bg-rose-500" />
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-secondary/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Emergency fund</span>
                    <span className="text-sm font-semibold text-foreground">{formatNaira(1_250_000, { compact: true })}</span>
                  </div>
                  <div className="h-2 rounded-full bg-background">
                    <div className="h-2 w-[62%] rounded-full bg-sky-500" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="pb-16">
          <div className="mb-6 max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Everything you need to make better money decisions.</h2>
            <p className="mt-2 text-sm text-muted-foreground">A focused toolset for budgeting, planning, and staying on top of your obligations.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-border/70 bg-card/80 shadow-sm">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
