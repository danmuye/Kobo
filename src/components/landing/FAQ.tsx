import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface QAPair {
  question: string;
  answer: string;
}

const faqs: QAPair[] = [
  {
    question: "Is Kobo free to use?",
    answer: "Yes. Kobo is completely free with no paid tiers or hidden features. All functionality — budgets, goals, debt tracking, analytics — is available to every user.",
  },
  {
    question: "Where is my data stored?",
    answer: "Your data is stored locally on your device by default. If you choose to sign in, you can optionally enable Firebase cloud sync for backup and cross-device access. You control whether sync is on or off.",
  },
  {
    question: "Can I use Kobo offline?",
    answer: "Yes. Kobo works fully offline. All features are available without an internet connection. When you enable cloud sync, changes are synchronized automatically when you reconnect.",
  },
  {
    question: "How do I track savings goals?",
    answer: "Create a goal with a target amount and date. Log contributions as transactions linked to that goal, and Kobo tracks your progress with visual milestones and forecasts.",
  },
  {
    question: "Can I manage debt in Kobo?",
    answer: "Yes. Kobo's debt management tracks loans, credit cards, and other obligations. It calculates payoff timelines, interest projections, and payment schedules automatically.",
  },
  {
    question: "Is my financial data secure?",
    answer: "Your data never leaves your device unless you enable cloud sync. If you use Firebase sync, all data is encrypted in transit and at rest using Firebase's enterprise security infrastructure.",
  },
  {
    question: "Can I export my data?",
    answer: "Yes. Kobo supports full data export and restore. You can back up your entire financial history and restore it at any time.",
  },
  {
    question: "Does Kobo work on mobile?",
    answer: "Yes. Kobo is fully responsive and works on phones, tablets, and desktops. The interface adapts to your screen size automatically.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-12 max-w-2xl divide-y divide-border/60"
        >
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            const id = `faq-${i}`;
            const panelId = `${id}-panel`;

            return (
              <div key={i} className="py-4">
                <button
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-4 text-left text-sm font-medium text-foreground transition-colors hover:text-primary"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      id={panelId}
                      role="region"
                      aria-labelledby={id}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pt-3 text-sm leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
