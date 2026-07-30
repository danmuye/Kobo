import { motion } from "framer-motion";
import { Lock, Database, Shield, Globe, Eye, Server } from "lucide-react";

const points = [
  {
    icon: Lock,
    title: "Data Ownership",
    description: "Your financial data belongs to you. We never sell, share, or monetize your information.",
  },
  {
    icon: Database,
    title: "Local-First Architecture",
    description: "Your data is stored locally by default. You are always in control.",
  },
  {
    icon: Shield,
    title: "Firebase Security",
    description: "Optional cloud sync uses Firebase's enterprise-grade encryption and access controls.",
  },
  {
    icon: Globe,
    title: "Offline Support",
    description: "Full functionality without an internet connection. Your data, always available.",
  },
  {
    icon: Eye,
    title: "Total Privacy",
    description: "No tracking, no analytics, no third-party data collection. Just you and your finances.",
  },
  {
    icon: Server,
    title: "Secure Sync",
    description: "End-to-end encrypted synchronization when you choose to enable cloud backup.",
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

export default function SecuritySection() {
  return (
    <section className="relative border-y border-border/40 bg-secondary/20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Security & Privacy
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Your financial data is yours. We built Kobo to respect that.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {points.map((point) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.title}
                variants={cardItem}
                className="rounded-xl border border-border/60 bg-card/50 p-6"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{point.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{point.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
