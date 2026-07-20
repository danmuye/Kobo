import type { Account, Transaction } from "@/types";

export type ActivityLevel = "active" | "low" | "inactive";

export interface ActivityRule {
  recentActivityDays: number;
  highTransactionCount: number;
  highTransactionWindowDays: number;
  lowActivityDays: number;
}

export const DEFAULT_ACTIVITY_RULES: ActivityRule = {
  recentActivityDays: 7,
  highTransactionCount: 5,
  highTransactionWindowDays: 30,
  lowActivityDays: 30,
};

function getTransactionDate(tx: Transaction): Date {
  return new Date(tx.date);
}

function isTransactionForAccount(tx: Transaction, accountName: string): boolean {
  if (tx.type === "transfer") {
    return tx.fromAccount === accountName || tx.toAccount === accountName;
  }
  return tx.account === accountName;
}

function countRecentTransactions(
  transactions: Transaction[],
  accountName: string,
  withinDays: number,
  now: Date,
): number {
  const cutoff = new Date(now.getTime() - withinDays * 24 * 60 * 60 * 1000);
  let count = 0;
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    if (!isTransactionForAccount(tx, accountName)) continue;
    if (getTransactionDate(tx) >= cutoff) {
      count++;
    }
  }
  return count;
}

function hasRecentTransaction(
  transactions: Transaction[],
  accountName: string,
  withinDays: number,
  now: Date,
): boolean {
  const cutoff = new Date(now.getTime() - withinDays * 24 * 60 * 60 * 1000);
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    if (!isTransactionForAccount(tx, accountName)) continue;
    if (getTransactionDate(tx) >= cutoff) {
      return true;
    }
  }
  return false;
}

export function getAccountActivityLevel(
  accountName: string,
  transactions: Transaction[],
  rules: ActivityRule = DEFAULT_ACTIVITY_RULES,
  now: Date = new Date(),
): ActivityLevel {
  const safeTxs = Array.isArray(transactions) ? transactions : [];

  const hasRecent = hasRecentTransaction(safeTxs, accountName, rules.recentActivityDays, now);
  const count = countRecentTransactions(safeTxs, accountName, rules.highTransactionWindowDays, now);

  if (hasRecent || count > rules.highTransactionCount) {
    return "active";
  }

  const hasAny = hasRecentTransaction(safeTxs, accountName, rules.lowActivityDays, now);
  if (hasAny) {
    return "low";
  }

  return "inactive";
}

export interface AccountActivityResult {
  accountName: string;
  activityLevel: ActivityLevel;
  recentTransactionCount: number;
}

export function getAccountsActivity(
  accounts: Account[],
  transactions: Transaction[],
  rules: ActivityRule = DEFAULT_ACTIVITY_RULES,
  now: Date = new Date(),
): AccountActivityResult[] {
  const safeAcc = Array.isArray(accounts) ? accounts : [];
  const safeTxs = Array.isArray(transactions) ? transactions : [];

  return safeAcc.map((account) => ({
    accountName: account.name,
    activityLevel: getAccountActivityLevel(account.name, safeTxs, rules, now),
    recentTransactionCount: countRecentTransactions(safeTxs, account.name, rules.lowActivityDays, now),
  }));
}
