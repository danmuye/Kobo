import type { Transaction, Budget, SavingsGoal, GoalContributionEntry, Debt, Account } from "@/types";

const id = () => Math.random().toString(36).slice(2, 10);

export const seedAccounts: Account[] = [
  { id: id(), name: "Salary Account", bank: "GTBank", type: "bank", balance: 1_250_000, currency: "NGN", color: "#10b981", icon: "landmark", openingBalance: 500_000, notes: "Main salary account" },
  { id: id(), name: "Daily Spend", bank: "Access Bank", type: "bank", balance: 320_500, currency: "NGN", color: "#3b82f6", icon: "building", openingBalance: 200_000, notes: "" },
  { id: id(), name: "Opay Wallet", bank: "Opay", type: "mobile_wallet", balance: 75_400, currency: "NGN", color: "#8b5cf6", icon: "smartphone", openingBalance: 20_000, notes: "" },
  { id: id(), name: "Palmpay", bank: "Palmpay", type: "mobile_wallet", balance: 42_800, currency: "NGN", color: "#f59e0b", icon: "wallet", openingBalance: 10_000, notes: "" },
  { id: id(), name: "Cash", bank: "—", type: "cash", balance: 18_000, currency: "NGN", color: "#06b6d4", icon: "banknote", openingBalance: 5_000, notes: "" },
  { id: id(), name: "Investment Portfolio", bank: "Cowrywise", type: "investment", balance: 850_000, currency: "NGN", color: "#ec4899", icon: "trending-up", openingBalance: 500_000, notes: "Mutual funds & treasury bills" },
];

export const transactionCategories = [
  "Food & Dining", "Transportation", "Rent", "Utilities", "Entertainment",
  "Shopping", "Healthcare", "Education", "Salary", "Freelance", "Investment", "Family Support",
];

const descByCat: Record<string, string[]> = {
  "Food & Dining": ["Chicken Republic", "Mr Biggs lunch", "Suya at Glover", "Jollof rice combo", "Shoprite groceries"],
  Transportation: ["Bolt to VI", "Uber to Lekki", "Fuel at Mobil", "BRT card top-up", "Keke to market"],
  Rent: ["Apartment rent — Lekki", "Service charge"],
  Utilities: ["IKEDC electricity", "DSTV subscription", "MTN data bundle", "Airtel airtime", "Spectranet internet"],
  Entertainment: ["Netflix subscription", "Cinema — Filmhouse", "Spotify premium", "Afrobeats concert ticket"],
  Shopping: ["Jumia order", "Konga checkout", "Balogun market", "Ankara fabric"],
  Healthcare: ["HMO premium", "Pharmacy — HealthPlus", "Lab tests"],
  Education: ["Online course — Udemy", "Books"],
  Salary: ["Monthly salary", "Bonus payment"],
  Freelance: ["Web design project", "Consulting fees", "Tech contract"],
  Investment: ["Cowrywise return", "PiggyVest interest", "Dividend payout"],
  "Family Support": ["Mum's upkeep", "Sibling school fees"],
};

const accountNames = seedAccounts.map((a) => a.name);

function randomTransactions(count: number): Transaction[] {
  const list: Transaction[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const cat = transactionCategories[Math.floor(Math.random() * transactionCategories.length)];
    const type: "income" | "expense" = ["Salary", "Freelance", "Investment"].includes(cat) ? "income" : "expense";
    const descs = descByCat[cat] ?? [cat];
    const date = new Date(now);
    date.setDate(now.getDate() - Math.floor(Math.random() * 90));
    const amount =
      type === "income"
        ? Math.round((Math.random() * 400_000 + 100_000) / 1000) * 1000
        : Math.round((Math.random() * 35_000 + 1500) / 100) * 100;
    list.push({
      id: id(),
      date: date.toISOString(),
      description: descs[Math.floor(Math.random() * descs.length)],
      category: cat,
      account: accountNames[Math.floor(Math.random() * accountNames.length)],
      amount,
      type,
    });
  }
  return list.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export const seedTransactions = randomTransactions(60);

export const seedBudgets: Budget[] = [
  { id: id(), name: "Groceries & Food", category: "Food & Dining", icon: "food", amount: 120_000, spent: 87_500, period: "monthly" },
  { id: id(), name: "Transport", category: "Transportation", icon: "transport", amount: 60_000, spent: 54_200, period: "monthly" },
  { id: id(), name: "Rent & Housing", category: "Rent", icon: "home", amount: 350_000, spent: 350_000, period: "monthly" },
  { id: id(), name: "Utilities & Bills", category: "Utilities", icon: "bolt", amount: 45_000, spent: 28_900, period: "monthly" },
  { id: id(), name: "Entertainment", category: "Entertainment", icon: "play", amount: 25_000, spent: 31_400, period: "monthly" },
  { id: id(), name: "Shopping", category: "Shopping", icon: "bag", amount: 80_000, spent: 22_000, period: "monthly" },
  { id: id(), name: "Healthcare", category: "Healthcare", icon: "heart", amount: 40_000, spent: 12_500, period: "monthly" },
  { id: id(), name: "Family Support", category: "Family Support", icon: "users", amount: 100_000, spent: 70_000, period: "monthly" },
];

function buildContributions(goalId: string, saved: number, monthsBack: number): GoalContributionEntry[] {
  const now = new Date();
  const count = Math.max(1, Math.floor(monthsBack));
  const perContribution = Math.round(saved / count / 1000) * 1000;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - (count - 1 - i));
    return { id: id(), goalId, amount: perContribution, date: d.toISOString() };
  });
}

const _g1 = id(), _g2 = id(), _g3 = id(), _g4 = id();

export const seedGoals: SavingsGoal[] = [
  { id: _g1, name: "Emergency Fund", target: 2_000_000, saved: 1_250_000, deadline: "2026-12-31", icon: "shield", createdAt: "2025-01-15T00:00:00.000Z" },
  { id: _g2, name: "Japa Travel Fund", target: 5_000_000, saved: 1_800_000, deadline: "2027-06-30", icon: "plane", createdAt: "2025-06-01T00:00:00.000Z" },
  { id: _g3, name: "New Laptop", target: 850_000, saved: 620_000, deadline: "2026-09-30", icon: "laptop", createdAt: "2025-11-01T00:00:00.000Z" },
  { id: _g4, name: "House Down Payment", target: 15_000_000, saved: 3_400_000, deadline: "2028-12-31", icon: "home", createdAt: "2024-06-01T00:00:00.000Z" },
];

export const seedGoalMilestones: GoalMilestone[] = [
  // Emergency Fund: 62.5% → milestones: 10, 25, 50 (75 not reached)
  { id: id(), goalId: _g1, pct: 10, reachedAt: "2025-02-15T00:00:00.000Z", notified: true },
  { id: id(), goalId: _g1, pct: 25, reachedAt: "2025-04-01T00:00:00.000Z", notified: true },
  { id: id(), goalId: _g1, pct: 50, reachedAt: "2025-08-20T00:00:00.000Z", notified: true },
  // Japa Travel: 36% → milestones: 10, 25
  { id: id(), goalId: _g2, pct: 10, reachedAt: "2025-07-15T00:00:00.000Z", notified: true },
  { id: id(), goalId: _g2, pct: 25, reachedAt: "2025-10-01T00:00:00.000Z", notified: true },
  // New Laptop: 72.9% → milestones: 10, 25, 50
  { id: id(), goalId: _g3, pct: 10, reachedAt: "2025-12-01T00:00:00.000Z", notified: true },
  { id: id(), goalId: _g3, pct: 25, reachedAt: "2026-01-15T00:00:00.000Z", notified: true },
  { id: id(), goalId: _g3, pct: 50, reachedAt: "2026-03-20T00:00:00.000Z", notified: true },
  // House Down Payment: 22.7% → milestone: 10
  { id: id(), goalId: _g4, pct: 10, reachedAt: "2024-08-01T00:00:00.000Z", notified: true },
];

export const seedGoalContributions: GoalContributionEntry[] = [
  ...buildContributions(_g1, 1_250_000, 10),
  ...buildContributions(_g2, 1_800_000, 8),
  ...buildContributions(_g3, 620_000, 6),
  ...buildContributions(_g4, 3_400_000, 18),
];

export const seedDebts: Debt[] = [
  { id: id(), name: "Carbon Loan", lender: "Carbon", balance: 180_000, originalAmount: 300_000, interestRate: 4.5, minPayment: 25_000, dueDate: "2026-11-15" },
  { id: id(), name: "FairMoney", lender: "FairMoney", balance: 95_000, originalAmount: 150_000, interestRate: 6.0, minPayment: 18_000, dueDate: "2026-08-01" },
  { id: id(), name: "Family Loan", lender: "Uncle Tunde", balance: 250_000, originalAmount: 500_000, interestRate: 0, minPayment: 30_000, dueDate: "2027-01-20" },
];
