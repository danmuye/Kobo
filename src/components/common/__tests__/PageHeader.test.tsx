import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "../PageHeader";
import { Button } from "@/components/ui/button";

describe("PageHeader", () => {
  it("renders title", () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<PageHeader title="Dashboard" subtitle="Overview of your finances" />);
    expect(screen.getByText("Overview of your finances")).toBeInTheDocument();
  });

  it("renders action when provided", () => {
    render(
      <PageHeader
        title="Transactions"
        action={<Button>Add New</Button>}
      />,
    );
    expect(screen.getByRole("button", { name: /add new/i })).toBeInTheDocument();
  });

  it("does not render action container when no action", () => {
    const { container } = render(<PageHeader title="No Action" />);
    const outer = container.querySelector("div > div");
    expect(outer?.children).toHaveLength(1);
  });
});
