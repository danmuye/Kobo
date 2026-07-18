export function sanitizeFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(sanitizeFirestoreData) as unknown as T;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (value === undefined) continue;
    if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeFirestoreData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}
