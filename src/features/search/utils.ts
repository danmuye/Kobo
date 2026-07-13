import type { Account, Budget, Debt, SavingsGoal, Transaction } from "@/types";

export type SearchKind = "transaction" | "budget" | "account" | "goal" | "debt";

export interface SearchResult {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  matchedText: string;
}

interface FinanceSearchData {
  transactions: Transaction[];
  budgets: Budget[];
  accounts: Account[];
  goals: SavingsGoal[];
  debts: Debt[];
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function buildHighlight(value: string, query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return value;
  const lowerValue = normalize(value);
  const index = lowerValue.indexOf(normalizedQuery);
  if (index < 0) return value;
  return `${value.slice(0, index)}${value.slice(index, index + normalizedQuery.length)}${value.slice(index + normalizedQuery.length)}`;
}

function matchText(value: string, query: string) {
  return normalize(value).includes(normalize(query));
}

export function searchFinanceData(data: FinanceSearchData, query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [] as SearchResult[];

  const results: SearchResult[] = [];

  data.transactions.forEach((transaction) => {
    const haystack = [
      transaction.description,
      transaction.category,
      transaction.account,
      transaction.type,
      transaction.notes ?? "",
      transaction.fromAccount ?? "",
      transaction.toAccount ?? "",
      ...(transaction.attachments ?? []),
    ].join(" ").toLowerCase();
    if (!matchText(haystack, normalizedQuery)) return;
    results.push({
      kind: "transaction",
      id: transaction.id,
      title: transaction.description,
      subtitle: `${transaction.category} • ${transaction.account}`,
      href: "/transactions",
      matchedText: transaction.description,
    });
  });

  data.budgets.forEach((budget) => {
    const haystack = [budget.name, budget.category, budget.period].join(" ");
    if (!matchText(haystack, normalizedQuery)) return;
    results.push({
      kind: "budget",
      id: budget.id,
      title: budget.name,
      subtitle: `${budget.category} • ${budget.period}`,
      href: "/budgets",
      matchedText: budget.name,
    });
  });

  data.accounts.forEach((account) => {
    const haystack = [account.name, account.bank, account.type].join(" ");
    if (!matchText(haystack, normalizedQuery)) return;
    results.push({
      kind: "account",
      id: account.id,
      title: account.name,
      subtitle: `${account.bank} • ${account.type}`,
      href: "/accounts",
      matchedText: account.name,
    });
  });

  data.goals.forEach((goal) => {
    const haystack = [goal.name, goal.deadline, goal.icon].join(" ");
    if (!matchText(haystack, normalizedQuery)) return;
    results.push({
      kind: "goal",
      id: goal.id,
      title: goal.name,
      subtitle: `Deadline ${goal.deadline}`,
      href: "/goals",
      matchedText: goal.name,
    });
  });

  data.debts.forEach((debt) => {
    const haystack = [debt.name, debt.lender].join(" ");
    if (!matchText(haystack, normalizedQuery)) return;
    results.push({
      kind: "debt",
      id: debt.id,
      title: debt.name,
      subtitle: `Lender ${debt.lender}`,
      href: "/debts",
      matchedText: debt.name,
    });
  });

  return results.slice(0, 8);
}

/**
 * Wrap the portion of `text` that matches `query` in `<mark>` tags.
 * Returns the original text unchanged when there is no match.
 */
export function highlightMatch(text: string, query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return text;
  const lowerText = normalize(text);
  const index = lowerText.indexOf(normalizedQuery);
  if (index < 0) return text;
  const end = index + normalizedQuery.length;
  return `${text.slice(0, index)}<mark>${text.slice(index, end)}</mark>${text.slice(end)}`;
}
