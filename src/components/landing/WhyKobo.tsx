import { motion } from "framer-motion";
import { Zap, Sparkles, Clock, Wifi, Smartphone, Cloud } from "lucide-react";

interface Reason {
  icon: typeof Zap;
  title: string;
  description: string;
}

const reasons: Reason[] = [
  {
    icon: Sparkles,
    title: "Automation",
    description: "Transactions are categorized automatically. No manual sorting, no spreadsheets.",
  },
  {
    icon: Clock,
    title: "Clarity",
    description: "See your entire financial picture at a glance. Income, expenses, savings — all in one place.",
  },
  {
    icon: Zap,
    title: "Simplicity",
    description: "Built for everyday decisions, not accounting. Open, add a transaction, move on.",
  },
  {
    icon: Wifi,
    title: "Offline Capability",
    description: "Works without internet. Your data stays available wherever you are.",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description: "Optional Firebase synchronization keeps your data secure and accessible across devices.",
  },
  {
    icon: Smartphone,
    title: "Mobile Responsive",
    description: "Designed for every screen. Manage your finances from your phone, tablet, or desktop.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function WhyKobo() {
  return (
    <section id="why-kobo" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Why Kobo?
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Spreadsheets are flexible. Kobo is purpose-built.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {reasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <motion.div
                key={reason.title}
                variants={cardItem}
                className="group rounded-xl border border-border/60 bg-card/50 p-6 transition-all duration-200 hover:border-border hover:bg-card/80 hover:shadow-elegant"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{reason.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{reason.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
