import { type Variants, type Transition } from "framer-motion";

export const ease = [0.22, 1, 0.36, 1] as const;

export const spring = { type: "spring", stiffness: 300, damping: 24 } as const;

export const fadeIn: Transition = { duration: 0.2, ease };

export const slideUp: Transition = { duration: 0.2, ease };

export const cardEntrance: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease } },
};

export const itemEntrance: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

export const hoverLift = { y: -2, transition: { duration: 0.2, ease } };

export const tapScale = { scale: 0.97, transition: { duration: 0.12, ease } };

export const tooltipEntrance: Transition = { duration: 0.15, ease };

export const progressFill: Transition = { duration: 0.6, ease };

export const labelUppercase = "text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground";
