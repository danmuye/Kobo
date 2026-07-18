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
  async add(data: Omit<AppNotification, "id" | "timestamp" | "read">): Promise<string> {
    return useNotificationStore.getState().addNotification(data);
  }
  async markAsRead(id: string): Promise<void> {
    useNotificationStore.getState().markAsRead(id);
  }
  async markAllAsRead(): Promise<void> {
    useNotificationStore.getState().markAllAsRead();
  }
  async remove(id: string): Promise<void> {
    useNotificationStore.getState().removeNotification(id);
  }
  async clearAll(): Promise<void> {
    useNotificationStore.getState().clearAll();
  }
  getUnreadCount(): number {
    return useNotificationStore.getState().getUnreadCount();
  }
  getPreferences(): NotificationPreferences {
    return useNotificationStore.getState().preferences;
  }
  async updatePreference(key: NotificationPreferenceKey, value: boolean): Promise<void> {
    useNotificationStore.getState().updatePreference(key, value);
  }
  async clearAllData(): Promise<void> {
    useNotificationStore.getState().clearAllData();
  }
  async restoreData(data: { notifications: AppNotification[]; preferences: NotificationPreferences }): Promise<void> {
    useNotificationStore.getState().restoreData(data);
  }
}
