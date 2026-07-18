import type { Account, Transaction } from "@/types";

export function computeAccountBalance(account: Account, transactions: Transaction[]): number {
  const safeTxs = Array.isArray(transactions) ? transactions : [];
  let balance = account.openingBalance;
  for (let i = 0; i < safeTxs.length; i++) {
    const tx = safeTxs[i];
    if (tx.type === "income" && tx.account === account.name) {
      balance += tx.amount;
    } else if (tx.type === "expense" && tx.account === account.name) {
      balance -= tx.amount;
    } else if (tx.type === "transfer") {
      if (tx.fromAccount === account.name) balance -= tx.amount;
      if (tx.toAccount === account.name) balance += tx.amount;
    }
  }
  return balance;
}

export function computeBalances(accounts: Account[], transactions: Transaction[]): Map<string, number> {
  const map = new Map<string, number>();
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  for (let i = 0; i < safeAccounts.length; i++) {
    map.set(safeAccounts[i].id, computeAccountBalance(safeAccounts[i], transactions));
  }
  return map;
}
