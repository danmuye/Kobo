import type {
  AppNotification, NotificationPreferences, NotificationPreferenceKey,
} from "@/types/notifications";

export interface INotificationService {
  list(): AppNotification[];
  add(data: Omit<AppNotification, "id" | "timestamp" | "read">): Promise<string>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  remove(id: string): Promise<void>;
  clearAll(): Promise<void>;
  getUnreadCount(): number;
  getPreferences(): NotificationPreferences;
  updatePreference(key: NotificationPreferenceKey, value: boolean): Promise<void>;
  clearAllData(): Promise<void>;
  restoreData(data: { notifications: AppNotification[]; preferences: NotificationPreferences }): Promise<void>;
}
