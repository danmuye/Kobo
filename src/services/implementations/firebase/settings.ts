import type { AppearanceSettings, LocalizationSettings, AppSettings } from "@/store/settings";
import type { ISettingsService } from "@/services/interfaces";
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

  get(): AppSettings { throw new Error("Use loadAsync() for Firebase"); }
  updateAppearance(): void { throw new Error("Async only"); }
  updateLocalization(): void { throw new Error("Async only"); }
  resetAll(): void { throw new Error("Async only"); }
  restoreSettings(): void { throw new Error("Async only"); }
  clearAllData(): void { throw new Error("Async only"); }

  async loadAsync(): Promise<AppSettings | null> {
    const col = await this.colPromise;
    const docs = await col.getAll();
    const doc = docs[0];
    if (!doc) return null;
    return { appearance: doc.appearance, localization: doc.localization };
  }

  async updateAppearanceAsync(patch: Partial<AppearanceSettings>): Promise<void> {
    const col = await this.colPromise;
    const current = await this.loadAsync();
    if (!current) return;
    const merged: AppSettings = { ...current, appearance: { ...current.appearance, ...patch } };
    await col.create({ ...merged, updatedAt: new Date().toISOString() });
  }

  async updateLocalizationAsync(patch: Partial<LocalizationSettings>): Promise<void> {
    const col = await this.colPromise;
    const current = await this.loadAsync();
    if (!current) return;
    const merged: AppSettings = { ...current, localization: { ...current.localization, ...patch } };
    await col.create({ ...merged, updatedAt: new Date().toISOString() });
  }
}
