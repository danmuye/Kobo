const STORAGE_KEY = "kobo-notification-dedup-v1";
const MAX_FINGERPRINTS = 10000;

function loadFingerprints(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr: string[] = JSON.parse(raw);
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveFingerprints(fingerprints: Set<string>): void {
  try {
    const arr = Array.from(fingerprints).slice(-MAX_FINGERPRINTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // localStorage full — clear and start fresh
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* noop */ }
  }
}

export class DedupLayer {
  private fingerprints: Set<string>;

  constructor() {
    this.fingerprints = loadFingerprints();
  }

  has(fingerprint: string): boolean {
    return this.fingerprints.has(fingerprint);
  }

  mark(fingerprint: string): void {
    this.fingerprints.add(fingerprint);
    saveFingerprints(this.fingerprints);
  }

  hasOrMark(fingerprint: string): boolean {
    if (this.fingerprints.has(fingerprint)) return true;
    this.fingerprints.add(fingerprint);
    saveFingerprints(this.fingerprints);
    return false;
  }

  clear(): void {
    this.fingerprints.clear();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* noop */ }
  }
}
