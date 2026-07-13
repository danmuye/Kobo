import type { AppNotification, NotificationPreferenceKey, NotificationPreferences } from "@/types/notifications";
import type { INotificationService } from "@/services/interfaces";
import { useNotificationStore } from "@/store/notifications";

const STORAGE_KEY = "kobo-notifications-v1";

function persistNotificationState(): void {
  const { notifications, preferences } = useNotificationStore.getState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ notifications, preferences }));
}

function loadNotificationState(): { notifications: AppNotification[]; preferences: NotificationPreferences } | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export class LocalNotificationService implements INotificationService {
  private unsub: (() => void) | null = null;

  init(): void {
    const saved = loadNotificationState();
    if (saved) {
      useNotificationStore.getState().restoreData(saved);
    }
    this.unsub = useNotificationStore.subscribe(() => {
      persistNotificationState();
    });
  }

  destroy(): void {
    this.unsub?.();
  }

  list(): AppNotification[] {
    return useNotificationStore.getState().notifications;
  }
  add(data: Omit<AppNotification, "id" | "timestamp" | "read">): string {
    return useNotificationStore.getState().addNotification(data);
  }
  markAsRead(id: string): void {
    useNotificationStore.getState().markAsRead(id);
  }
  markAllAsRead(): void {
    useNotificationStore.getState().markAllAsRead();
  }
  remove(id: string): void {
    useNotificationStore.getState().removeNotification(id);
  }
  clearAll(): void {
    useNotificationStore.getState().clearAll();
  }
  getUnreadCount(): number {
    return useNotificationStore.getState().getUnreadCount();
  }
  getPreferences(): NotificationPreferences {
    return useNotificationStore.getState().preferences;
  }
  updatePreference(key: NotificationPreferenceKey, value: boolean): void {
    useNotificationStore.getState().updatePreference(key, value);
  }
  clearAllData(): void {
    useNotificationStore.getState().clearAllData();
  }
  restoreData(data: { notifications: AppNotification[]; preferences: NotificationPreferences }): void {
    useNotificationStore.getState().restoreData(data);
  }
}
