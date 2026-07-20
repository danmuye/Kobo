import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "../StatCard";
import { Wallet } from "lucide-react";

describe("StatCard", () => {
  it("renders label and formatted value", () => {
    render(<StatCard label="Total Balance" value={500000} delta={10} icon={Wallet} variant="balance" data={[100, 200, 150]} />);
    expect(screen.getByText("Total Balance")).toBeInTheDocument();
    expect(screen.getByText("₦500,000")).toBeInTheDocument();
  });

  it("renders positive delta with up arrow", () => {
    render(<StatCard label="Income" value={100000} delta={5.5} icon={Wallet} variant="income" data={[100, 200]} />);
    expect(screen.getByText("5.5%")).toBeInTheDocument();
  });

  it("renders negative delta with down arrow", () => {
    render(<StatCard label="Expense" value={50000} delta={-3.2} icon={Wallet} variant="expense" data={[100, 200]} />);
    expect(screen.getByText("3.2%")).toBeInTheDocument();
  });

  it("renders compact value when over 999,999", () => {
    render(<StatCard label="Savings" value={2500000} delta={15} icon={Wallet} variant="savings" data={[100, 200]} />);
    expect(screen.getByText("₦2.50M")).toBeInTheDocument();
  });
});
