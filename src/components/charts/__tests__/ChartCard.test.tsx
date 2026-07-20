import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChartCard } from "../ChartCard";

describe("ChartCard", () => {
  it("renders title", () => {
    render(<ChartCard title="Spending Chart" />);
    expect(screen.getByText("Spending Chart")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<ChartCard title="Chart" subtitle="Last 6 months" />);
    expect(screen.getByText("Last 6 months")).toBeInTheDocument();
  });

  it("renders action element", () => {
    render(<ChartCard title="Chart" action={<button>Filter</button>} />);
    expect(screen.getByRole("button", { name: /filter/i })).toBeInTheDocument();
  });

  it("renders children when not loading nor empty", () => {
    render(
      <ChartCard title="Chart">
        <p>Chart content</p>
      </ChartCard>,
    );
    expect(screen.getByText("Chart content")).toBeInTheDocument();
  });

  it("renders skeleton when loading", () => {
    const { container } = render(
      <ChartCard title="Chart" loading>
        <p>Hidden</p>
      </ChartCard>,
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders empty state when empty", () => {
    render(
      <ChartCard title="Chart" empty emptyMessage="No data found">
        <p>Hidden</p>
      </ChartCard>,
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    expect(screen.getByText("No data found")).toBeInTheDocument();
  });

  it("uses default empty message", () => {
    render(<ChartCard title="Chart" empty />);
    expect(screen.getByText("No data available.")).toBeInTheDocument();
  });

  it("renders with h3 heading by default", () => {
    const { container } = render(<ChartCard title="Default Heading" />);
    const h3 = container.querySelector("h3");
    expect(h3).toBeInTheDocument();
    expect(h3).toHaveTextContent("Default Heading");
  });

  it("renders with h2 heading when specified", () => {
    const { container } = render(<ChartCard title="H2 Heading" headingLevel="h2" />);
    const h2 = container.querySelector("h2");
    expect(h2).toBeInTheDocument();
    expect(h2).toHaveTextContent("H2 Heading");
  });
});
