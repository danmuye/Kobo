import { describe, it, expect, vi, beforeEach } from "vitest";
import { useNotificationStore } from "@/store/notifications";
import type { AppNotification, NotificationPreferenceKey } from "@/types/notifications";
import { DEFAULT_PREFERENCES } from "@/types/notifications";

function buildNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: `n-${Math.random().toString(36).slice(2, 8)}`,
    title: "Test Notification",
    message: "This is a test",
    type: "info",
    category: "system",
    timestamp: new Date().toISOString(),
    read: false,
    ...overrides,
  };
}

beforeEach(() => {
  useNotificationStore.setState({
    notifications: [],
    preferences: { ...DEFAULT_PREFERENCES },
  });
});

describe("Notifications workflow", () => {
  it("generates a notification", () => {
    const id = useNotificationStore.getState().addNotification({
      title: "Budget Alert",
      message: "You have exceeded your food budget",
      type: "warning",
      category: "budget",
    });

    const all = useNotificationStore.getState().notifications;
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(id);
    expect(all[0].title).toBe("Budget Alert");
    expect(all[0].type).toBe("warning");
    expect(all[0].category).toBe("budget");
    expect(all[0].read).toBe(false);
    expect(all[0].timestamp).toBeDefined();
  });

  it("lists notifications newest first", () => {
    useNotificationStore.getState().addNotification({ title: "First", message: "m1", type: "info", category: "system" });
    useNotificationStore.getState().addNotification({ title: "Second", message: "m2", type: "info", category: "system" });

    const all = useNotificationStore.getState().notifications;
    expect(all).toHaveLength(2);
    expect(all[0].title).toBe("Second");
    expect(all[1].title).toBe("First");
  });

  it("marks a notification as read", () => {
    const id = useNotificationStore.getState().addNotification({
      title: "Read Me", message: "test", type: "info", category: "system",
    });

    useNotificationStore.getState().markAsRead(id);

    const found = useNotificationStore.getState().notifications.find((n) => n.id === id);
    expect(found?.read).toBe(true);
  });

  it("marks all notifications as read", () => {
    useNotificationStore.getState().addNotification({ title: "A", message: "m1", type: "info", category: "system" });
    useNotificationStore.getState().addNotification({ title: "B", message: "m2", type: "info", category: "system" });
    useNotificationStore.getState().addNotification({ title: "C", message: "m3", type: "info", category: "system" });

    useNotificationStore.getState().markAllAsRead();

    const allRead = useNotificationStore.getState().notifications.every((n) => n.read);
    expect(allRead).toBe(true);
  });

  it("removes a single notification", () => {
    const id = useNotificationStore.getState().addNotification({
      title: "Delete Me", message: "gone", type: "info", category: "system",
    });

    useNotificationStore.getState().removeNotification(id);

    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });

  it("clears all notifications", () => {
    useNotificationStore.getState().addNotification({ title: "A", message: "m1", type: "info", category: "system" });
    useNotificationStore.getState().addNotification({ title: "B", message: "m2", type: "info", category: "system" });

    useNotificationStore.getState().clearAll();

    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });

  it("tracks unread count", () => {
    expect(useNotificationStore.getState().getUnreadCount()).toBe(0);

    useNotificationStore.getState().addNotification({ title: "Unread", message: "m1", type: "info", category: "system" });
    expect(useNotificationStore.getState().getUnreadCount()).toBe(1);

    const id = useNotificationStore.getState().addNotification({
      title: "Read Later", message: "m2", type: "info", category: "system",
    });
    expect(useNotificationStore.getState().getUnreadCount()).toBe(2);

    useNotificationStore.getState().markAsRead(id);
    expect(useNotificationStore.getState().getUnreadCount()).toBe(1);
  });

  it("updates notification preferences", () => {
    const prefs = useNotificationStore.getState().preferences;
    expect(prefs.budgetAlerts).toBe(true);

    useNotificationStore.getState().updatePreference("budgetAlerts", false);
    expect(useNotificationStore.getState().preferences.budgetAlerts).toBe(false);

    useNotificationStore.getState().updatePreference("debtReminders", false);
    expect(useNotificationStore.getState().preferences.debtReminders).toBe(false);
    expect(useNotificationStore.getState().preferences.savingsAlerts).toBe(true);
  });

  it("clears all data including preferences", () => {
    useNotificationStore.getState().addNotification({ title: "A", message: "m", type: "info", category: "system" });
    useNotificationStore.getState().updatePreference("budgetAlerts", false);

    useNotificationStore.getState().clearAllData();

    expect(useNotificationStore.getState().notifications).toHaveLength(0);
    expect(useNotificationStore.getState().preferences.budgetAlerts).toBe(true);
  });

  it("restores data from backup", () => {
    const notifications = [buildNotification({ id: "n1", title: "Restored" })];
    const preferences = { ...DEFAULT_PREFERENCES, budgetAlerts: false };

    useNotificationStore.getState().restoreData({ notifications, preferences });

    expect(useNotificationStore.getState().notifications).toHaveLength(1);
    expect(useNotificationStore.getState().notifications[0].title).toBe("Restored");
    expect(useNotificationStore.getState().preferences.budgetAlerts).toBe(false);
  });

  it("supports all notification categories", () => {
    const categories: Array<AppNotification["category"]> = [
      "budget", "goal", "transaction", "debt", "account",
      "export", "system", "milestone", "deadline", "alert",
    ];

    for (const cat of categories) {
      useNotificationStore.getState().addNotification({
        title: `Category ${cat}`,
        message: `Testing ${cat}`,
        type: "info",
        category: cat,
      });
    }

    expect(useNotificationStore.getState().notifications).toHaveLength(10);
  });
});
