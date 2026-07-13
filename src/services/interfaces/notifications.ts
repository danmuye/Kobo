import type {
  AppNotification, NotificationPreferences, NotificationPreferenceKey,
} from "@/types/notifications";

export interface INotificationService {
  list(): AppNotification[];
  add(data: Omit<AppNotification, "id" | "timestamp" | "read">): string;
  markAsRead(id: string): void;
  markAllAsRead(): void;
  remove(id: string): void;
  clearAll(): void;
  getUnreadCount(): number;
  getPreferences(): NotificationPreferences;
  updatePreference(key: NotificationPreferenceKey, value: boolean): void;
  clearAllData(): void;
  restoreData(data: { notifications: AppNotification[]; preferences: NotificationPreferences }): void;
}
