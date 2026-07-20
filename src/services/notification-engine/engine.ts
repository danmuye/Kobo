import { toast } from "sonner";
import type { AppNotification, NotificationType } from "@/types/notifications";
import { useNotificationStore } from "@/store/notifications";
import { getNotificationService } from "@/services/service-provider";
import { DedupLayer } from "./dedup";
import {
  type FinancialEvent,
  EVENT_TEMPLATES,
  formatTemplate,
  buildDedupFingerprint,
} from "./types";

const TOAST_FN: Record<NotificationType, typeof toast.success> = {
  success: toast.success,
  error: toast.error,
  warning: toast.warning,
  info: toast.info,
};

export class NotificationEngine {
  private static instance: NotificationEngine;
  private dedup: DedupLayer;
  private initialized = false;

  static getInstance(): NotificationEngine {
    if (!NotificationEngine.instance) {
      NotificationEngine.instance = new NotificationEngine();
    }
    return NotificationEngine.instance;
  }

  private constructor() {
    this.dedup = new DedupLayer();
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.dedup = new DedupLayer();
  }

  destroy(): void {
    this.initialized = false;
    this.dedup.clear();
  }

  clearDedup(): void {
    this.dedup.clear();
  }

  emit(event: FinancialEvent): string | null {
    if (!this.initialized) {
      this.init();
    }

    const template = EVENT_TEMPLATES[event.type];
    if (!template) return null;

    const fingerprint = buildDedupFingerprint(event, template.dedupPeriod);

    if (this.dedup.hasOrMark(fingerprint)) {
      return null;
    }

    const formattedTitle = formatTemplate(template.titlePattern, this.buildFormatValues(event));
    const formattedMessage = formatTemplate(template.messagePattern, this.buildFormatValues(event));

    const notificationData: Omit<AppNotification, "id" | "timestamp" | "read"> & { eventFingerprint?: string } = {
      title: formattedTitle,
      message: formattedMessage,
      type: template.type,
      category: template.category,
      relatedId: event.entityId,
      eventFingerprint: fingerprint,
    };

    let id: string;
    const state = useNotificationStore.getState();
    const existing = state.notifications.find((n) => n.eventFingerprint === fingerprint);
    if (existing) {
      return null;
    }

    try {
      id = state.addNotification(notificationData);
    } catch {
      id = crypto.randomUUID();
    }

    getNotificationService().add(notificationData).catch(() => {});

    TOAST_FN[template.type](formattedMessage || formattedTitle, {
      description: formattedMessage ? formattedTitle : undefined,
      duration: 4000,
    });

    return id;
  }

  private buildFormatValues(event: FinancialEvent): Record<string, string> {
    const meta = event.metadata ?? {};
    const values: Record<string, string> = {};
    for (const [key, val] of Object.entries(meta)) {
      values[key] = val != null ? String(val) : "";
    }
    if (event.entityName) values.name = event.entityName;
    if (event.amount != null) values.amount = String(event.amount);
    values.entityId = event.entityId;
    return values;
  }
}
