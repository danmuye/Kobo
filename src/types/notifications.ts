export type NotificationType = "success" | "error" | "warning" | "info";

export type NotificationCategory =
  | "budget" | "goal" | "transaction" | "debt" | "account"
  | "export" | "system" | "milestone" | "deadline" | "alert";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  relatedId?: string;
}

export type NotificationPreferenceKey =
  | "budgetAlerts"
  | "savingsAlerts"
  | "debtReminders"
  | "accountAlerts"
  | "monthlySummaries"
  | "largeTransactionAlerts";

export interface NotificationPreferences {
  budgetAlerts: boolean;
  savingsAlerts: boolean;
  debtReminders: boolean;
  accountAlerts: boolean;
  monthlySummaries: boolean;
  largeTransactionAlerts: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  budgetAlerts: true,
  savingsAlerts: true,
  debtReminders: true,
  accountAlerts: true,
  monthlySummaries: true,
  largeTransactionAlerts: true,
};
