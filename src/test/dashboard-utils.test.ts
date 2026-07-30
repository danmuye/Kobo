import { describe, expect, it } from "vitest";
import { getBudgetHealthBreakdown } from "@/features/dashboard/utils";

describe("getBudgetHealthBreakdown", () => {
  it("returns formatted string for all categories", () => {
    expect(getBudgetHealthBreakdown(3, 1, 0)).toBe("3 healthy · 1 near limit");
  });

  it("returns single category", () => {
    expect(getBudgetHealthBreakdown(2, 0, 0)).toBe("2 healthy");
    expect(getBudgetHealthBreakdown(0, 0, 2)).toBe("2 exceeded");
  });

  it("returns 'No budgets' when all counts are zero", () => {
    expect(getBudgetHealthBreakdown(0, 0, 0)).toBe("No budgets");
  });

  it("includes all three categories when present", () => {
    expect(getBudgetHealthBreakdown(2, 1, 1)).toBe("2 healthy · 1 near limit · 1 exceeded");
  });
});
