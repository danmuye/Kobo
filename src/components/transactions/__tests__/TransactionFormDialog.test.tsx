import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFinanceStore } from "@/store/finance";
import { useTransactionModal } from "@/store/transaction-modal";
import { buildAccount, resetCounter } from "@/test/factories";
import { renderWithProviders } from "@/test/test-utils";
import { notify } from "@/services/notifications";

vi.mock("@/services/notifications", () => ({
  notify: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  emitFinancialEvent: vi.fn(),
}));

vi.mock("@/services/service-provider", () => ({
  getFinanceService: () => ({
    transactions: {
      create: vi.fn().mockResolvedValue({ id: "new-tx" }),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  }),
}));

vi.mock("@/store/transaction-modal", () => ({
  useTransactionModal: vi.fn(),
}));

// Dynamically import to avoid hoisting issues
const { TransactionFormDialog } = await import("../TransactionFormDialog");

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
    accounts: [buildAccount({ id: "a1", name: "Main Account" })],
  });
  vi.mocked(useTransactionModal).mockReturnValue({
    isOpen: true,
    mode: "create",
    editingTransaction: null,
    close: vi.fn(),
  });
});

describe("TransactionFormDialog", () => {
  it("renders dialog title for new transaction", () => {
    renderWithProviders(<TransactionFormDialog />);
    expect(screen.getByText("Add Transaction")).toBeInTheDocument();
  });

  it("renders form fields", () => {
    renderWithProviders(<TransactionFormDialog />);
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Amount (₦)")).toBeInTheDocument();
  });

  it("shows transfer fields when transfer type is selected", async () => {
    renderWithProviders(<TransactionFormDialog />);
    const typeTrigger = screen.getAllByRole("combobox")[0];
    await userEvent.click(typeTrigger);
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /transfer/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("option", { name: /transfer/i }));
    expect(screen.getByText("From account")).toBeInTheDocument();
    const toLabels = screen.getAllByText("To account");
    expect(toLabels.length).toBeGreaterThan(0);
  });

  it("shows account field for non-transfer type", () => {
    renderWithProviders(<TransactionFormDialog />);
    expect(screen.getByText("Account")).toBeInTheDocument();
  });

  it("renders cancel and submit buttons", () => {
    renderWithProviders(<TransactionFormDialog />);
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add transaction/i })).toBeInTheDocument();
  });

  it("renders edit title when in edit mode", () => {
    vi.mocked(useTransactionModal).mockReturnValue({
      isOpen: true,
      mode: "edit",
      editingTransaction: null,
      close: vi.fn(),
    });
    renderWithProviders(<TransactionFormDialog />);
    expect(screen.getByText("Edit Transaction")).toBeInTheDocument();
  });

  it("renders duplicate title when in duplicate mode", () => {
    vi.mocked(useTransactionModal).mockReturnValue({
      isOpen: true,
      mode: "duplicate",
      editingTransaction: null,
      close: vi.fn(),
    });
    renderWithProviders(<TransactionFormDialog />);
    expect(screen.getByText("Duplicate Transaction")).toBeInTheDocument();
  });

  it("closes dialog on cancel", async () => {
    const close = vi.fn();
    vi.mocked(useTransactionModal).mockReturnValue({
      isOpen: true,
      mode: "create",
      editingTransaction: null,
      close,
    });
    renderWithProviders(<TransactionFormDialog />);
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(close).toHaveBeenCalled();
  });
});
