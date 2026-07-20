import { toast } from "sonner";
import { getNotificationService } from "@/services/service-provider";
import type { NotificationType, NotificationCategory } from "@/types/notifications";
import { useNotificationStore } from "@/store/notifications";
import { NotificationEngine } from "@/services/notification-engine/engine";
import type { FinancialEventType } from "@/services/notification-engine/types";

const engine = NotificationEngine.getInstance();

const TOAST_FN: Record<NotificationType, typeof toast.success> = {
  success: toast.success,
  error: toast.error,
  warning: toast.warning,
  info: toast.info,
};

interface NotifyOptions {
  actionUrl?: string;
  relatedId?: string;
  duration?: number;
}

interface NotifyFn {
  (title: string, message: string, type?: NotificationType, category?: NotificationCategory, options?: NotifyOptions): Promise<string>;
  success: (title: string, message: string, category?: NotificationCategory, options?: NotifyOptions) => Promise<string>;
  error: (title: string, message: string, category?: NotificationCategory, options?: NotifyOptions) => Promise<string>;
  warning: (title: string, message: string, category?: NotificationCategory, options?: NotifyOptions) => Promise<string>;
  info: (title: string, message: string, category?: NotificationCategory, options?: NotifyOptions) => Promise<string>;
}

const _notify = async (
  title: string,
  message: string,
  type: NotificationType = "info",
  category: NotificationCategory = "system",
  options?: NotifyOptions,
): Promise<string> => {
  const notificationData: Omit<AppNotification, "id" | "timestamp" | "read"> & { eventFingerprint?: string } = {
    title,
    message,
    type,
    category,
  };
  if (options?.actionUrl !== undefined) notificationData.actionUrl = options.actionUrl;
  if (options?.relatedId !== undefined) notificationData.relatedId = options.relatedId;

  const service = getNotificationService();
  const state = useNotificationStore.getState();

  notificationData.eventFingerprint = `legacy::${category}::${title}::${options?.relatedId ?? ""}`;

  const existing = state.notifications.find((n) => n.eventFingerprint === notificationData.eventFingerprint);
  if (existing) return existing.id;

  const id = await service.add(notificationData);

  TOAST_FN[type](message || title, {
    description: message ? title : undefined,
    duration: options?.duration ?? 4000,
  });

  return id;
};

export const notify = _notify as NotifyFn;

notify.success = async (title, message, category, options) =>
  _notify(title, message, "success", category ?? "system", options);

notify.error = async (title, message, category, options) =>
  _notify(title, message, "error", category ?? "system", options);

notify.warning = async (title, message, category, options) =>
  _notify(title, message, "warning", category ?? "system", options);

notify.info = async (title, message, category, options) =>
  _notify(title, message, "info", category ?? "system", options);

export function emitFinancialEvent(
  type: FinancialEventType,
  entityId: string,
  entityName?: string,
  amount?: number,
  metadata?: Record<string, string | number | boolean | null | undefined>,
): string | null {
  return engine.emit({
    type,
    timestamp: new Date().toISOString(),
    entityId,
    entityName,
    amount,
    metadata,
  });
}
