import { motion } from "framer-motion";
import { BarChart3, Target, Wallet2, Landmark, CreditCard, TrendingUp, Bell, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ShowcaseItem {
  icon: typeof Wallet2;
  label: string;
  description: string;
  color: string;
}

const items: ShowcaseItem[] = [
  { icon: BarChart3, label: "Dashboard", description: "Real-time overview of your entire financial picture.", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { icon: Target, label: "Budgets", description: "Set limits and track spending across categories.", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { icon: PiggyBank, label: "Savings Goals", description: "Save toward what matters with progress tracking.", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  { icon: Landmark, label: "Debt Management", description: "Visualize payoff timelines and reduce interest.", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  { icon: Wallet2, label: "Accounts", description: "All your accounts — bank, wallet, cash — in one place.", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { icon: CreditCard, label: "Wallets", description: "Track mobile wallets and digital balances.", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { icon: TrendingUp, label: "Analytics", description: "Understand patterns with charts and trends.", color: "bg-primary/10 text-primary" },
  { icon: FileText, label: "Reports", description: "Generate detailed reports for any period.", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  { icon: Bell, label: "Notifications", description: "Stay informed with smart alerts and reminders.", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const gridItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function PiggyBank(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.4-1 1.4-1.8" />
      <path d="M21 8.5c-.5-.5-1.2-.5-1.7 0l-1.5 1.5" />
      <circle cx="8" cy="12" r=".5" />
    </svg>
  );
}

export default function ProductShowcase() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything you need to manage your money
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            A focused toolset for budgeting, saving, and staying on top of your finances.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                variants={gridItem}
                className="group rounded-xl border border-border/60 bg-card/50 p-5 transition-all duration-200 hover:border-border hover:bg-card/80 hover:shadow-elegant"
              >
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/dashboard">Explore the Dashboard →</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
