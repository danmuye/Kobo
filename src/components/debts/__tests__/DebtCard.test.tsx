import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DebtCard } from "../DebtCard";
import { useFinanceStore } from "@/store/finance";
import { buildDebt, resetCounter } from "@/test/factories";
import { renderWithProviders } from "@/test/test-utils";
import type { DebtMetrics } from "@/services/debt-matching";

beforeEach(() => {
  resetCounter();
});

function makeDebtMetrics(overrides: Partial<DebtMetrics> = {}): DebtMetrics {
  return {
    amountPaid: 50000,
    remainingBalance: 450000,
    percentagePaid: 10,
    paymentCount: 2,
    monthlyPaid: 5000,
    totalInterestPaid: 0,
    daysUntilDue: 25,
    isPaidOff: false,
    isOverdue: false,
    ...overrides,
  };
}

describe("DebtCard", () => {
  it("renders debt name and lender", () => {
    const debt = { ...buildDebt({ name: "Car Loan", lender: "GTBank" }), metrics: makeDebtMetrics() };
    renderWithProviders(<DebtCard debt={debt} />);
    expect(screen.getByText("Car Loan")).toBeInTheDocument();
    expect(screen.getByText(/GTBank/)).toBeInTheDocument();
  });

  it("renders status badge", () => {
    const debt = { ...buildDebt({ name: "Test" }), metrics: makeDebtMetrics({ percentagePaid: 5 }) };
    renderWithProviders(<DebtCard debt={debt} />);
    expect(screen.getByText("Getting started")).toBeInTheDocument();
  });

  it("renders original and remaining amounts", () => {
    const debt = { ...buildDebt({ name: "Test", originalAmount: 500000 }), metrics: makeDebtMetrics({ remainingBalance: 450000 }) };
    renderWithProviders(<DebtCard debt={debt} />);
    expect(screen.getByText("₦500,000")).toBeInTheDocument();
    expect(screen.getByText("₦450,000")).toBeInTheDocument();
  });

  it("calls onEdit when edit is clicked", async () => {
    const onEdit = vi.fn();
    const debt = { ...buildDebt({ name: "Editable" }), metrics: makeDebtMetrics() };
    renderWithProviders(<DebtCard debt={debt} onEdit={onEdit} />);
    await userEvent.click(screen.getByLabelText("Debt actions"));
    await userEvent.click(screen.getByText("Edit Debt"));
    expect(onEdit).toHaveBeenCalledWith(debt);
  });

  it("calls onDelete when delete is clicked", async () => {
    const onDelete = vi.fn();
    const debt = { ...buildDebt({ name: "Deletable" }), metrics: makeDebtMetrics() };
    renderWithProviders(<DebtCard debt={debt} onDelete={onDelete} />);
    await userEvent.click(screen.getByLabelText("Debt actions"));
    await userEvent.click(screen.getByText("Delete Debt"));
    expect(onDelete).toHaveBeenCalledWith(debt);
  });

  it("calls onMakePayment when make payment is clicked", async () => {
    const onMakePayment = vi.fn();
    const debt = { ...buildDebt({ name: "Payable" }), metrics: makeDebtMetrics() };
    renderWithProviders(<DebtCard debt={debt} onMakePayment={onMakePayment} />);
    await userEvent.click(screen.getByText("Make Payment"));
    expect(onMakePayment).toHaveBeenCalledWith(debt);
  });

  it("shows overdue styling", () => {
    const debt = { ...buildDebt({ name: "Overdue" }), metrics: makeDebtMetrics({ isOverdue: true }) };
    renderWithProviders(<DebtCard debt={debt} />);
    const matches = screen.getAllByText("Overdue");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("shows paid off styling", () => {
    const debt = { ...buildDebt({ name: "Paid" }), metrics: makeDebtMetrics({ isPaidOff: true, percentagePaid: 100, remainingBalance: 0 }) };
    renderWithProviders(<DebtCard debt={debt} />);
    expect(screen.getByText("Paid Off")).toBeInTheDocument();
    expect(screen.getByLabelText("Debt paid off")).toBeInTheDocument();
  });

  it("renders progress bar", () => {
    const debt = { ...buildDebt({ name: "Test" }), metrics: makeDebtMetrics({ percentagePaid: 35 }) };
    renderWithProviders(<DebtCard debt={debt} />);
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "35");
  });

  it("has article role with accessible name", () => {
    const debt = { ...buildDebt({ name: "Test Loan" }), metrics: makeDebtMetrics({ percentagePaid: 5 }) };
    renderWithProviders(<DebtCard debt={debt} />);
    expect(screen.getByRole("article")).toHaveAttribute("aria-label", "Test Loan — Getting started");
  });
});
