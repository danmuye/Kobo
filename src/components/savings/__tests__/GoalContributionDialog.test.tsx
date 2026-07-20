import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoalContributionDialog } from "../GoalContributionDialog";
import { useFinanceStore } from "@/store/finance";
import { buildGoal, buildAccount, resetCounter } from "@/test/factories";
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
    accounts: [buildAccount({ id: "a1", name: "Main", openingBalance: 100000 })],
  });
});

describe("GoalContributionDialog", () => {
  const goal = buildGoal({ name: "Vacation", targetAmount: 500000 });

  it("renders dialog title with goal name", () => {
    renderWithProviders(
      <GoalContributionDialog goal={goal} open={true} onOpenChange={vi.fn()} />,
    );
    expect(screen.getByText(/Add Contribution.*Vacation/)).toBeInTheDocument();
  });

  it("renders form fields", () => {
    renderWithProviders(
      <GoalContributionDialog goal={goal} open={true} onOpenChange={vi.fn()} />,
    );
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/from account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
  });

  it("disables submit when amount is zero", () => {
    renderWithProviders(
      <GoalContributionDialog goal={goal} open={true} onOpenChange={vi.fn()} />,
    );
    const submitBtn = screen.getByRole("button", { name: /add contribution/i });
    expect(submitBtn).toBeDisabled();
  });

  it("enables submit when amount > 0 and account selected", async () => {
    renderWithProviders(
      <GoalContributionDialog goal={goal} open={true} onOpenChange={vi.fn()} />,
    );
    const amountInput = screen.getByLabelText(/amount/i);
    await userEvent.type(amountInput, "5000");
    const accountTrigger = screen.getByRole("combobox");
    await userEvent.click(accountTrigger);
    const option = await screen.findByRole("option");
    await userEvent.click(option);
    const submitBtn = screen.getByRole("button", { name: /add contribution/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it("calls onOpenChange(false) on cancel", async () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <GoalContributionDialog goal={goal} open={true} onOpenChange={onOpenChange} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders without goal name when goal is null", () => {
    renderWithProviders(
      <GoalContributionDialog goal={null} open={true} onOpenChange={vi.fn()} />,
    );
    expect(screen.getAllByText("Add Contribution").length).toBeGreaterThan(0);
  });

  it("shows available balance when account selected", async () => {
    renderWithProviders(
      <GoalContributionDialog goal={goal} open={true} onOpenChange={vi.fn()} />,
    );
    const accountTrigger = screen.getByRole("combobox");
    await userEvent.click(accountTrigger);
    const option = await screen.findByRole("option");
    await userEvent.click(option);
    expect(screen.getByText(/Available balance/)).toBeInTheDocument();
  });
});
