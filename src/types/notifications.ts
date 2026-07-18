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
  | "budgetEndingAlerts"
  | "budgetEndedAlerts"
  | "budgetThresholdAlerts"
  | "savingsAlerts"
  | "goalMilestoneAlerts"
  | "debtReminders"
  | "accountAlerts"
  | "monthlySummaries"
  | "largeTransactionAlerts";

export interface NotificationPreferences {
  budgetAlerts: boolean;
  budgetEndingAlerts: boolean;
  budgetEndedAlerts: boolean;
  budgetThresholdAlerts: boolean;
  savingsAlerts: boolean;
  goalMilestoneAlerts: boolean;
  debtReminders: boolean;
  accountAlerts: boolean;
  monthlySummaries: boolean;
  largeTransactionAlerts: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  budgetAlerts: true,
  budgetEndingAlerts: true,
  budgetEndedAlerts: true,
  budgetThresholdAlerts: true,
  savingsAlerts: true,
  goalMilestoneAlerts: true,
  debtReminders: true,
  accountAlerts: true,
  monthlySummaries: true,
  largeTransactionAlerts: true,
};
