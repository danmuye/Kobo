import type { AppNotification, NotificationPreferenceKey, NotificationPreferences } from "@/types/notifications";
import type { INotificationService } from "@/services/interfaces";
import { useNotificationStore } from "@/store/notifications";
import { createCollection, type FirestoreCollection } from "@/services/firebase/firestore";

const CONFIG_DOC_ID = "config";

export class FirebaseNotificationService implements INotificationService {
  private colPromise: Promise<FirestoreCollection<FirebaseNotificationDoc>>;

  constructor(userId: string) {
    this.colPromise = createCollection<FirebaseNotificationDoc>(`users/${userId}/notifications`);
  }

  async init(): Promise<void> {
    const col = await this.colPromise;
    const doc = await col.getById(CONFIG_DOC_ID);
    if (doc) {
      useNotificationStore.getState().restoreData({
        notifications: doc.notifications,
        preferences: doc.preferences,
      });
    }
  }

  list(): AppNotification[] {
    return useNotificationStore.getState().notifications;
  }

  async add(data: Omit<AppNotification, "id" | "timestamp" | "read">): Promise<string> {
    const id = useNotificationStore.getState().addNotification(data);
    await this.persist();
    return id;
  }

  async markAsRead(id: string): Promise<void> {
    useNotificationStore.getState().markAsRead(id);
    await this.persist();
  }

  async markAllAsRead(): Promise<void> {
    useNotificationStore.getState().markAllAsRead();
    await this.persist();
  }

  async remove(id: string): Promise<void> {
    useNotificationStore.getState().removeNotification(id);
    await this.persist();
  }

  async clearAll(): Promise<void> {
    useNotificationStore.getState().clearAll();
    await this.persist();
  }

  getUnreadCount(): number {
    return useNotificationStore.getState().getUnreadCount();
  }

  getPreferences(): NotificationPreferences {
    return useNotificationStore.getState().preferences;
  }

  async updatePreference(key: NotificationPreferenceKey, value: boolean): Promise<void> {
    useNotificationStore.getState().updatePreference(key, value);
    await this.persist();
  }

  async clearAllData(): Promise<void> {
    useNotificationStore.getState().clearAllData();
    await this.persist();
  }

  async restoreData(data: { notifications: AppNotification[]; preferences: NotificationPreferences }): Promise<void> {
    useNotificationStore.getState().restoreData(data);
    await this.persist();
  }

  private async persist(): Promise<void> {
    try {
      const col = await this.colPromise;
      const { notifications, preferences } = useNotificationStore.getState();
      await col.set(CONFIG_DOC_ID, {
        id: CONFIG_DOC_ID,
        notifications,
        preferences,
        updatedAt: new Date().toISOString(),
      } as FirebaseNotificationDoc);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[NotificationService] persist failed — notification state not saved to Firestore:", err);
      }
    }
  }
}

interface FirebaseNotificationDoc {
  id: string;
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  updatedAt: string;
}
