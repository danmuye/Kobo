import { create } from "zustand";
import type {
  AppNotification, NotificationType, NotificationCategory,
  NotificationPreferences, NotificationPreferenceKey,
} from "@/types/notifications";
import { DEFAULT_PREFERENCES } from "@/types/notifications";

const generateId = () => Math.random().toString(36).slice(2, 10);

interface NotificationState {
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  addNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read"> & { eventFingerprint?: string }) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
  updatePreference: (key: NotificationPreferenceKey, value: boolean) => void;
  clearAllData: () => void;
  restoreData: (data: { notifications: AppNotification[]; preferences: NotificationPreferences }) => void;
}

export const useNotificationStore = create<NotificationState>()(
  (set, get) => ({
    notifications: [],
    preferences: { ...DEFAULT_PREFERENCES },

    addNotification: (n) => {
      const id = generateId();
      const notification: AppNotification = {
        ...n,
        id,
        timestamp: new Date().toISOString(),
        read: false,
      };
      set((s) => ({ notifications: [notification, ...s.notifications] }));
      return id;
    },

    markAsRead: (id) => {
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
      }));
    },

    markAllAsRead: () => {
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
      }));
    },

    removeNotification: (id) => {
      set((s) => ({
        notifications: s.notifications.filter((n) => n.id !== id),
      }));
    },

    clearAll: () => {
      set({ notifications: [] });
    },

    getUnreadCount: () => {
      return get().notifications.filter((n) => !n.read).length;
    },

    updatePreference: (key, value) => {
      set((s) => ({
        preferences: { ...s.preferences, [key]: value },
      }));
    },

    clearAllData: () => {
      set({ notifications: [], preferences: { ...DEFAULT_PREFERENCES } });
    },

    restoreData: (data) => {
      set({
        notifications: data.notifications,
        preferences: data.preferences,
      });
    },
  }),
);
