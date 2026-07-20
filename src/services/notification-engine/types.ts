import type { NotificationType, NotificationCategory } from "@/types/notifications";

export type FinancialEventType =
  | "transaction:created"
  | "transaction:updated"
  | "transaction:deleted"
  | "transfer:completed"
  | "budget:warning"
  | "budget:exceeded"
  | "budget:critical"
  | "budget:threshold"
  | "budget:ended"
  | "budget:ending"
  | "budget:fully-spent"
  | "goal:contribution"
  | "goal:completed"
  | "goal:exceeded"
  | "goal:milestone"
  | "goal:overdue"
  | "goal:deadline"
  | "goal:stalled"
  | "debt:payment"
  | "debt:completed"
  | "debt:overdue"
  | "debt:due"
  | "debt:milestone"
  | "account:created"
  | "account:updated"
  | "account:deleted"
  | "account:low-balance"
  | "account:negative-balance"
  | "large:expense"
  | "large:income"
  | "system:export"
  | "system:import"
  | "system:data-cleared"
  | "system:settings-reset"
  | "system:profile-updated"
  | "system:error";

export interface FinancialEvent {
  type: FinancialEventType;
  timestamp: string;
  entityId: string;
  entityName?: string;
  amount?: number;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface NotificationTemplate {
  type: NotificationType;
  category: NotificationCategory;
  titlePattern: string;
  messagePattern: string;
  dedupPeriod: "hour" | "day" | "month";
}

export const EVENT_TEMPLATES: Record<FinancialEventType, NotificationTemplate> = {
  "transaction:created": {
    type: "success",
    category: "transaction",
    titlePattern: "Transaction added",
    messagePattern: "{description} — {amount}",
    dedupPeriod: "hour",
  },
  "transaction:updated": {
    type: "info",
    category: "transaction",
    titlePattern: "Transaction updated",
    messagePattern: "{description}",
    dedupPeriod: "hour",
  },
  "transaction:deleted": {
    type: "info",
    category: "transaction",
    titlePattern: "Transaction deleted",
    messagePattern: "{description}",
    dedupPeriod: "hour",
  },
  "transfer:completed": {
    type: "info",
    category: "transaction",
    titlePattern: "Transfer completed",
    messagePattern: "{amount} transferred",
    dedupPeriod: "hour",
  },
  "budget:warning": {
    type: "warning",
    category: "budget",
    titlePattern: "{name} is nearing its limit",
    messagePattern: "{pct}% of the budget has been used. Consider adjusting spending.",
    dedupPeriod: "day",
  },
  "budget:critical": {
    type: "warning",
    category: "budget",
    titlePattern: "{name} is nearly exceeded",
    messagePattern: "{pct}% of the budget has been used.",
    dedupPeriod: "day",
  },
  "budget:exceeded": {
    type: "error",
    category: "budget",
    titlePattern: "{name} budget exceeded",
    messagePattern: "Spending has surpassed the budget by {overPct}%.",
    dedupPeriod: "day",
  },
  "budget:threshold": {
    type: "info",
    category: "budget",
    titlePattern: "{name} threshold reached",
    messagePattern: "{pct}% of the budget has been used.",
    dedupPeriod: "day",
  },
  "budget:ended": {
    type: "info",
    category: "budget",
    titlePattern: "{name} period ended",
    messagePattern: "The budget period has ended. {pct}% of the budget was used.",
    dedupPeriod: "day",
  },
  "budget:ending": {
    type: "warning",
    category: "budget",
    titlePattern: "{name} ending soon",
    messagePattern: "Only {days} day(s) left in this budget period.",
    dedupPeriod: "day",
  },
  "budget:fully-spent": {
    type: "warning",
    category: "budget",
    titlePattern: "{name} fully spent",
    messagePattern: "100% of the {name} budget has been used.",
    dedupPeriod: "day",
  },
  "goal:contribution": {
    type: "success",
    category: "goal",
    titlePattern: "Goal contribution",
    messagePattern: "{amount} added to {name}",
    dedupPeriod: "hour",
  },
  "goal:completed": {
    type: "success",
    category: "goal",
    titlePattern: "Goal Completed: {name}",
    messagePattern: "You've saved {saved} out of your {target} target!",
    dedupPeriod: "day",
  },
  "goal:exceeded": {
    type: "success",
    category: "goal",
    titlePattern: "Goal Exceeded: {name}",
    messagePattern: "You've saved {saved} — over your {target} target!",
    dedupPeriod: "day",
  },
  "goal:milestone": {
    type: "info",
    category: "milestone",
    titlePattern: "{pct}% Reached: {name}",
    messagePattern: "You've completed {pct}% of your savings target for {name}. Keep going!",
    dedupPeriod: "day",
  },
  "goal:overdue": {
    type: "error",
    category: "goal",
    titlePattern: "Goal Overdue: {name}",
    messagePattern: "Your goal was due but only {saved} of {target} was saved.",
    dedupPeriod: "day",
  },
  "goal:deadline": {
    type: "warning",
    category: "deadline",
    titlePattern: "Due in {days} day(s): {name}",
    messagePattern: "{detail}",
    dedupPeriod: "day",
  },
  "goal:stalled": {
    type: "info",
    category: "goal",
    titlePattern: "No Activity for {name}",
    messagePattern: "It's been {days} days since this goal was created. Create matching transactions to track progress.",
    dedupPeriod: "day",
  },
  "debt:payment": {
    type: "success",
    category: "debt",
    titlePattern: "Debt payment",
    messagePattern: "{amount} paid toward {name}",
    dedupPeriod: "hour",
  },
  "debt:completed": {
    type: "success",
    category: "debt",
    titlePattern: "Debt Paid Off: {name}",
    messagePattern: "You've fully paid off your {name} debt. Congratulations!",
    dedupPeriod: "day",
  },
  "debt:overdue": {
    type: "error",
    category: "debt",
    titlePattern: "Payment Overdue: {name}",
    messagePattern: "Your {name} payment of {balance} was due {days} day(s) ago.",
    dedupPeriod: "day",
  },
  "debt:due": {
    type: "warning",
    category: "debt",
    titlePattern: "Payment Due for {name}",
    messagePattern: "{balance} is due {label}. Min payment: {minPayment}.",
    dedupPeriod: "day",
  },
  "debt:milestone": {
    type: "info",
    category: "milestone",
    titlePattern: "{pct}% Paid: {name}",
    messagePattern: "You've paid {pct}% of your {name} debt. Keep going!",
    dedupPeriod: "day",
  },
  "account:created": {
    type: "success",
    category: "account",
    titlePattern: "Account added",
    messagePattern: "{name} has been added.",
    dedupPeriod: "hour",
  },
  "account:updated": {
    type: "info",
    category: "account",
    titlePattern: "Account updated",
    messagePattern: "{name} has been updated.",
    dedupPeriod: "hour",
  },
  "account:deleted": {
    type: "info",
    category: "account",
    titlePattern: "Account deleted",
    messagePattern: "{name} has been deleted.",
    dedupPeriod: "hour",
  },
  "account:low-balance": {
    type: "warning",
    category: "account",
    titlePattern: "Low Balance: {name}",
    messagePattern: "{name} has only {balance} remaining.",
    dedupPeriod: "day",
  },
  "account:negative-balance": {
    type: "error",
    category: "account",
    titlePattern: "Negative Balance: {name}",
    messagePattern: "{name} has a negative balance of {balance}. Please take action.",
    dedupPeriod: "day",
  },
  "large:expense": {
    type: "warning",
    category: "alert",
    titlePattern: "Large Expense: {description}",
    messagePattern: "{amount} spent on {category}.",
    dedupPeriod: "hour",
  },
  "large:income": {
    type: "success",
    category: "alert",
    titlePattern: "Large Income: {description}",
    messagePattern: "{amount} received from {category}.",
    dedupPeriod: "hour",
  },
  "system:export": {
    type: "success",
    category: "export",
    titlePattern: "Export complete",
    messagePattern: "{format} has been exported.",
    dedupPeriod: "hour",
  },
  "system:import": {
    type: "success",
    category: "system",
    titlePattern: "Import complete",
    messagePattern: "Data has been imported successfully.",
    dedupPeriod: "hour",
  },
  "system:data-cleared": {
    type: "info",
    category: "system",
    titlePattern: "Data cleared",
    messagePattern: "All data has been cleared.",
    dedupPeriod: "hour",
  },
  "system:settings-reset": {
    type: "info",
    category: "system",
    titlePattern: "Settings reset",
    messagePattern: "All settings have been reset to defaults.",
    dedupPeriod: "hour",
  },
  "system:profile-updated": {
    type: "success",
    category: "system",
    titlePattern: "Profile updated",
    messagePattern: "Your profile has been updated.",
    dedupPeriod: "hour",
  },
  "system:error": {
    type: "error",
    category: "system",
    titlePattern: "Error",
    messagePattern: "{detail}",
    dedupPeriod: "hour",
  },
};

export function formatTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`);
}

export function buildDedupFingerprint(
  event: FinancialEvent,
  dedupPeriod: "hour" | "day" | "month",
): string {
  const d = new Date(event.timestamp);
  let period: string;
  switch (dedupPeriod) {
    case "hour":
      period = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
      break;
    case "day":
      period = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      break;
    case "month":
      period = `${d.getFullYear()}-${d.getMonth()}`;
      break;
  }
  return `${event.type}::${event.entityId}::${period}`;
}
