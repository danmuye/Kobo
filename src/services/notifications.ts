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
  (title: string, message: string, type?: NotificationType, category?: NotificationCategory, options?: NotifyOptions): string;
  success: (title: string, message: string, category?: NotificationCategory, options?: NotifyOptions) => string;
  error: (title: string, message: string, category?: NotificationCategory, options?: NotifyOptions) => string;
  warning: (title: string, message: string, category?: NotificationCategory, options?: NotifyOptions) => string;
  info: (title: string, message: string, category?: NotificationCategory, options?: NotifyOptions) => string;
}

const _notify = (
  title: string,
  message: string,
  type: NotificationType = "info",
  category: NotificationCategory = "system",
  options?: NotifyOptions,
): string => {
  const id = getNotificationService().add({
    title,
    message,
    type,
    category,
    actionUrl: options?.actionUrl,
    relatedId: options?.relatedId,
  });

  TOAST_FN[type](message || title, {
    description: message ? title : undefined,
    duration: options?.duration ?? 4000,
  });

  return id;
};

export const notify = _notify as NotifyFn;

notify.success = (title, message, category, options) =>
  _notify(title, message, "success", category ?? "system", options);

notify.error = (title, message, category, options) =>
  _notify(title, message, "error", category ?? "system", options);

notify.warning = (title, message, category, options) =>
  _notify(title, message, "warning", category ?? "system", options);

notify.info = (title, message, category, options) =>
  _notify(title, message, "info", category ?? "system", options);
