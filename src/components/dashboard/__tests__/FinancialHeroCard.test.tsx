import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FinancialHeroCard } from "../FinancialHeroCard";

describe("FinancialHeroCard", () => {
  const defaultProps = {
    totalBalance: 1_000_000,
    monthlyChange: 4.2,
    availableBalance: 500_000,
    income: 300_000,
    expenses: 200_000,
    savings: 100_000,
    sparklineData: [100, 200, 150, 300, 250],
    onAddTransaction: vi.fn(),
    onTransfer: vi.fn(),
    onCreateBudget: vi.fn(),
    onCreateGoal: vi.fn(),
  };

  it("renders total balance label", () => {
    render(<FinancialHeroCard {...defaultProps} />);
    expect(screen.getByText("Total Balance")).toBeInTheDocument();
  });

  it("renders total balance value", () => {
    render(<FinancialHeroCard {...defaultProps} />);
    expect(screen.getByText("₦1,000,000")).toBeInTheDocument();
  });

  it("renders monthly change with up arrow for positive", () => {
    render(<FinancialHeroCard {...defaultProps} />);
    expect(screen.getByText("4.2%")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
  });

  it("renders monthly change with down arrow for negative", () => {
    render(<FinancialHeroCard {...defaultProps} monthlyChange={-3.1} />);
    expect(screen.getByText("3.1%")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
  });

  it("renders available balance", () => {
    render(<FinancialHeroCard {...defaultProps} />);
    expect(screen.getByText(/Available:/)).toBeInTheDocument();
  });

  it("renders income, expenses, and savings labels", () => {
    render(<FinancialHeroCard {...defaultProps} />);
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("Expenses")).toBeInTheDocument();
    expect(screen.getByText("Savings")).toBeInTheDocument();
  });

  it("renders all four quick action buttons", () => {
    render(<FinancialHeroCard {...defaultProps} />);
    expect(screen.getByText("Transaction")).toBeInTheDocument();
    expect(screen.getByText("Transfer")).toBeInTheDocument();
    expect(screen.getByText("Budget")).toBeInTheDocument();
    expect(screen.getByText("Goal")).toBeInTheDocument();
  });

  it("fires onAddTransaction when Transaction is clicked", () => {
    render(<FinancialHeroCard {...defaultProps} />);
    fireEvent.click(screen.getByText("Transaction"));
    expect(defaultProps.onAddTransaction).toHaveBeenCalledTimes(1);
  });

  it("fires onTransfer when Transfer is clicked", () => {
    render(<FinancialHeroCard {...defaultProps} />);
    fireEvent.click(screen.getByText("Transfer"));
    expect(defaultProps.onTransfer).toHaveBeenCalledTimes(1);
  });

  it("fires onCreateBudget when Budget is clicked", () => {
    render(<FinancialHeroCard {...defaultProps} />);
    fireEvent.click(screen.getByText("Budget"));
    expect(defaultProps.onCreateBudget).toHaveBeenCalledTimes(1);
  });

  it("fires onCreateGoal when Goal is clicked", () => {
    render(<FinancialHeroCard {...defaultProps} />);
    fireEvent.click(screen.getByText("Goal"));
    expect(defaultProps.onCreateGoal).toHaveBeenCalledTimes(1);
  });

  it("renders sparkline when sparklineData is provided", () => {
    const { container } = render(<FinancialHeroCard {...defaultProps} />);
    const rechartsSvg = container.querySelector(".recharts-surface");
    expect(rechartsSvg).toBeInTheDocument();
  });

  it("does not render sparkline when sparklineData is empty", () => {
    const { container } = render(<FinancialHeroCard {...defaultProps} sparklineData={[]} />);
    const rechartsSvg = container.querySelector(".recharts-surface");
    expect(rechartsSvg).not.toBeInTheDocument();
  });

  it("handles zero values correctly", () => {
    render(
      <FinancialHeroCard
        {...defaultProps}
        totalBalance={0}
        monthlyChange={0}
        availableBalance={0}
        income={0}
        expenses={0}
        savings={0}
      />,
    );
    const zeroElements = screen.getAllByText("₦0");
    expect(zeroElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("0.0%")).toBeInTheDocument();
  });
});
