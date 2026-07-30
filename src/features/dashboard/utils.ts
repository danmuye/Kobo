export function getBudgetHealthBreakdown(
  healthy: number,
  nearLimit: number,
  exceeded: number,
): string {
  const parts: string[] = [];
  if (healthy > 0) parts.push(`${healthy} healthy`);
  if (nearLimit > 0) parts.push(`${nearLimit} near limit`);
  if (exceeded > 0) parts.push(`${exceeded} exceeded`);
  return parts.length > 0 ? parts.join(" · ") : "No budgets";
}
