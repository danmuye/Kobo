import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DebtPaymentDialog } from "../DebtPaymentDialog";
import { useFinanceStore } from "@/store/finance";
import { buildDebt, buildAccount, resetCounter } from "@/test/factories";
import { renderWithProviders } from "@/test/test-utils";

vi.mock("@/services/notifications", () => ({
  notify: { success: vi.fn(), error: vi.fn() },
  emitFinancialEvent: vi.fn(),
}));

beforeEach(() => {
  resetCounter();
  useFinanceStore.setState({
    transactions: [],
    budgets: [],
    budgetHistory: [],
    goals: [],
    goalHistory: [],
    debts: [],
    debtHistory: [],
    accounts: [buildAccount({ id: "a1", name: "Checking", openingBalance: 200000 })],
  });
});

describe("DebtPaymentDialog", () => {
  const debt = buildDebt({ name: "Car Loan", originalAmount: 500000 });

  it("renders dialog title with debt name", () => {
    renderWithProviders(
      <DebtPaymentDialog debt={debt} open={true} onOpenChange={vi.fn()} />,
    );
    expect(screen.getByText(/Make Payment.*Car Loan/)).toBeInTheDocument();
  });

  it("renders form fields", () => {
    renderWithProviders(
      <DebtPaymentDialog debt={debt} open={true} onOpenChange={vi.fn()} />,
    );
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pay from account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
  });

  it("disables submit when amount is zero", () => {
    renderWithProviders(
      <DebtPaymentDialog debt={debt} open={true} onOpenChange={vi.fn()} />,
    );
    const submitBtn = screen.getByRole("button", { name: /make payment/i });
    expect(submitBtn).toBeDisabled();
  });

  it("enables submit when amount > 0 and account selected", async () => {
    renderWithProviders(
      <DebtPaymentDialog debt={debt} open={true} onOpenChange={vi.fn()} />,
    );
    const amountInput = screen.getByLabelText(/amount/i);
    await userEvent.type(amountInput, "10000");
    const accountTrigger = screen.getByRole("combobox");
    await userEvent.click(accountTrigger);
    const option = await screen.findByRole("option");
    await userEvent.click(option);
    const submitBtn = screen.getByRole("button", { name: /make payment/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it("calls onOpenChange(false) on cancel", async () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <DebtPaymentDialog debt={debt} open={true} onOpenChange={onOpenChange} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders without debt name when debt is null", () => {
    renderWithProviders(
      <DebtPaymentDialog debt={null} open={true} onOpenChange={vi.fn()} />,
    );
    expect(screen.getAllByText("Make Payment").length).toBeGreaterThan(0);
  });

  it("shows submitting state", async () => {
    renderWithProviders(
      <DebtPaymentDialog debt={debt} open={true} onOpenChange={vi.fn()} />,
    );
    const amountInput = screen.getByLabelText(/amount/i);
    await userEvent.type(amountInput, "10000");
    const accountTrigger = screen.getByRole("combobox");
    await userEvent.click(accountTrigger);
    const option = await screen.findByRole("option");
    await userEvent.click(option);
    const submitBtn = screen.getByRole("button", { name: /make payment/i });
    await userEvent.click(submitBtn);
  });
});
