import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { useIsMobile } from "../use-mobile";

function TestComponent() {
  const isMobile = useIsMobile();
  return <div data-testid="mobile">{isMobile ? "Mobile" : "Desktop"}</div>;
}

describe("useIsMobile", () => {
  it("returns false for default viewport (1024px)", () => {
    render(<TestComponent />);
    expect(screen.getByTestId("mobile").textContent).toBe("Desktop");
  });
});
