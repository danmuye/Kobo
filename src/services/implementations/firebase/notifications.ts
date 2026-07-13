import type { AppNotification, NotificationPreferenceKey, NotificationPreferences } from "@/types/notifications";
import type { INotificationService } from "@/services/interfaces";

export class FirebaseNotificationService implements INotificationService {
  list(): AppNotification[] { throw new Error("Async only"); }
  add(): string { throw new Error("Async only"); }
  markAsRead(): void { throw new Error("Async only"); }
  markAllAsRead(): void { throw new Error("Async only"); }
  remove(): void { throw new Error("Async only"); }
  clearAll(): void { throw new Error("Async only"); }
  getUnreadCount(): number { throw new Error("Async only"); }
  getPreferences(): NotificationPreferences { throw new Error("Async only"); }
  updatePreference(): void { throw new Error("Async only"); }
  clearAllData(): void { throw new Error("Async only"); }
  restoreData(): void { throw new Error("Async only"); }
}
