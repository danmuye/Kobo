import { toast } from "sonner";
import { getNotificationService } from "@/services/service-provider";
import type { NotificationType, NotificationCategory } from "@/types/notifications";

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
  const notificationData: Omit<AppNotification, "id" | "timestamp" | "read"> = {
    title,
    message,
    type,
    category,
  };
  if (options?.actionUrl !== undefined) notificationData.actionUrl = options.actionUrl;
  if (options?.relatedId !== undefined) notificationData.relatedId = options.relatedId;

  const id = await getNotificationService().add(notificationData);

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
