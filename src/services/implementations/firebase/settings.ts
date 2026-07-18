import type { AppearanceSettings, LocalizationSettings, AppSettings } from "@/store/settings";
import type { ISettingsService } from "@/services/interfaces";
import { useSettingsStore } from "@/store/settings";
import { createCollection, type FirestoreCollection } from "@/services/firebase/firestore";

const CONFIG_DOC_ID = "config";

export class FirebaseSettingsService implements ISettingsService {
  private colPromise: Promise<FirestoreCollection<FirebaseSettingsDoc>>;

  constructor(userId: string) {
    this.colPromise = createCollection<FirebaseSettingsDoc>(`users/${userId}/settings`);
  }

  async init(): Promise<void> {
    const loaded = await this.loadAsync();
    if (loaded) {
      useSettingsStore.getState().restoreSettings(loaded);
    }
  }

  get(): AppSettings {
    return useSettingsStore.getState().settings;
  }

  async updateAppearance(patch: Partial<AppearanceSettings>): Promise<void> {
    useSettingsStore.getState().updateAppearance(patch);
    await this.persist();
  }

  async updateLocalization(patch: Partial<LocalizationSettings>): Promise<void> {
    useSettingsStore.getState().updateLocalization(patch);
    await this.persist();
  }

  async resetAll(): Promise<void> {
    useSettingsStore.getState().resetAll();
    await this.persist();
  }

  async restoreSettings(s: AppSettings): Promise<void> {
    useSettingsStore.getState().restoreSettings(s);
    await this.persist();
  }

  async clearAllData(): Promise<void> {
    useSettingsStore.getState().clearAllData();
    await this.persist();
  }

  async loadAsync(): Promise<AppSettings | null> {
    const col = await this.colPromise;
    const doc = await col.getById(CONFIG_DOC_ID);
    if (!doc) return null;
    return { appearance: doc.appearance, localization: doc.localization };
  }

  private async persist(): Promise<void> {
    try {
      const col = await this.colPromise;
      const { settings } = useSettingsStore.getState();
      await col.set(CONFIG_DOC_ID, {
        id: CONFIG_DOC_ID,
        appearance: settings.appearance,
        localization: settings.localization,
        updatedAt: new Date().toISOString(),
      } as FirebaseSettingsDoc);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[SettingsService] persist failed — settings not saved to Firestore:", err);
      }
    }
  }
}

interface FirebaseSettingsDoc {
  id: string;
  appearance: AppearanceSettings;
  localization: LocalizationSettings;
  updatedAt: string;
}
