import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild?.className).toContain("bg-primary");
  });

  it("applies secondary variant", () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>);
    expect(container.firstChild?.className).toContain("bg-secondary");
  });

  it("applies destructive variant", () => {
    const { container } = render(<Badge variant="destructive">Danger</Badge>);
    expect(container.firstChild?.className).toContain("bg-destructive");
  });

  it("applies outline variant", () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    expect(container.firstChild?.className).toContain("text-foreground");
  });
});
