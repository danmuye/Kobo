import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface FeatureSectionProps {
  id?: string;
  title: string;
  description: string;
  visual: ReactNode;
  benefits: string[];
  cta?: ReactNode;
  reversed?: boolean;
}

export default function FeatureSection({
  id,
  title,
  description,
  visual,
  benefits,
  cta,
  reversed = false,
}: FeatureSectionProps) {
  return (
    <section id={id} className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className={`grid items-center gap-12 lg:gap-16 ${reversed ? "lg:grid-flow-dense lg:grid-cols-2" : "lg:grid-cols-2"}`}>
          <motion.div
            initial={{ opacity: 0, x: reversed ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className={reversed ? "lg:col-start-2" : ""}
          >
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {title}
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              {description}
            </p>
            <ul className="mt-6 space-y-3">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
            {cta && <div className="mt-8">{cta}</div>}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: reversed ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={reversed ? "lg:col-start-1" : ""}
          >
            {visual}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
