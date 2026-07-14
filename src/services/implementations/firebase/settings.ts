import type { AppearanceSettings, LocalizationSettings, AppSettings } from "@/store/settings";
import type { ISettingsService } from "@/services/interfaces";
import { useSettingsStore } from "@/store/settings";
import { createCollection, type FirestoreCollection } from "@/services/firebase/firestore";

interface FirebaseSettingsDoc {
  appearance: AppearanceSettings;
  localization: LocalizationSettings;
  updatedAt: string;
}

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

  updateAppearance(patch: Partial<AppearanceSettings>): void {
    useSettingsStore.getState().updateAppearance(patch);
    this.persist();
  }

  updateLocalization(patch: Partial<LocalizationSettings>): void {
    useSettingsStore.getState().updateLocalization(patch);
    this.persist();
  }

  resetAll(): void {
    useSettingsStore.getState().resetAll();
    this.persist();
  }

  restoreSettings(s: AppSettings): void {
    useSettingsStore.getState().restoreSettings(s);
    this.persist();
  }

  clearAllData(): void {
    useSettingsStore.getState().clearAllData();
    this.persist();
  }

  async loadAsync(): Promise<AppSettings | null> {
    const col = await this.colPromise;
    const docs = await col.getAll();
    const doc = docs[0];
    if (!doc) return null;
    return { appearance: doc.appearance, localization: doc.localization };
  }

  private async persist(): Promise<void> {
    try {
      const col = await this.colPromise;
      const { settings } = useSettingsStore.getState();
      await col.create({
        appearance: settings.appearance,
        localization: settings.localization,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // Firestore write failed — local state is already updated
    }
  }
}
