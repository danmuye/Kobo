/* Hallmark · genre: modern-minimal · macrostructure: workbench · theme: custom (kobo-emerald) · enrichment: tier-a · nav: N5 · footer: Ft5 */

import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import ProductShowcase from "@/components/landing/ProductShowcase";
import FeatureSection from "@/components/landing/FeatureSection";
import WorkflowTimeline from "@/components/landing/WorkflowTimeline";
import WhyKobo from "@/components/landing/WhyKobo";
import SecuritySection from "@/components/landing/SecuritySection";
import FAQ from "@/components/landing/FAQ";
import CTASection from "@/components/landing/CTASection";
import LandingFooter from "@/components/landing/LandingFooter";
import DashboardPreview from "@/components/landing/DashboardPreview";
import BudgetsPreview from "@/components/landing/BudgetsPreview";
import GoalsPreview from "@/components/landing/GoalsPreview";
import DebtPreview from "@/components/landing/DebtPreview";

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav />
      <LandingHero />
      <ProductShowcase />

      <FeatureSection
        id="budgets"
        title="Budget with confidence"
        description="Set spending limits across categories and track your progress in real time. Know exactly where your money goes each month."
        visual={<BudgetsPreview />}
        benefits={[
          "Create monthly budgets for any category",
          "Track spending vs. limits with visual progress bars",
          "Get alerts when you approach your limits",
          "Review past periods to refine your targets",
        ]}
        reversed
      />

      <FeatureSection
        id="goals"
        title="Save toward what matters"
        description="Set savings goals with target amounts and deadlines. Watch your progress grow with every contribution."
        visual={<GoalsPreview />}
        benefits={[
          "Define goals with target amount and date",
          "Log contributions and track milestones",
          "View forecasts to know if you are on track",
          "Celebrate each milestone reached",
        ]}
      />

      <FeatureSection
        id="debt"
        title="Manage debt, not stress"
        description="Track loans, credit cards, and other obligations with clear payoff timelines and interest projections."
        visual={<DebtPreview />}
        benefits={[
          "Log all debts with interest rates and minimums",
          "Visualize payoff timelines for each obligation",
          "Track payments and see balances decrease",
          "Understand total interest with projection insights",
        ]}
        reversed
      />

      <FeatureSection
        id="reports"
        title="Understand your patterns"
        description="Generate detailed reports to understand where your money comes from and where it goes."
        visual={<DashboardPreview />}
        benefits={[
          "Income and expense breakdowns by category",
          "Monthly trends and comparisons",
          "Exportable reports for any date range",
          "Clear visuals that make patterns obvious",
        ]}
      />

      <WorkflowTimeline />
      <WhyKobo />
      <SecuritySection />
      <FAQ />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
