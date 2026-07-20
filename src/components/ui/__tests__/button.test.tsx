import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("renders with default variant and size classes", () => {
    const { container } = render(<Button>Default</Button>);
    const btn = container.firstChild as HTMLElement;
    expect(btn.className).toContain("bg-primary");
    expect(btn.className).toContain("h-10");
  });

  it("applies variant classes", () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild?.className).toContain("bg-destructive");
  });

  it("applies size classes", () => {
    const { container } = render(<Button size="sm">Small</Button>);
    expect(container.firstChild?.className).toContain("h-9");
  });

  it("renders as child when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link</a>
      </Button>,
    );
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("fires onClick when clicked", async () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Click</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", async () => {
    const handler = vi.fn();
    render(<Button onClick={handler} disabled>Click</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("accepts additional className", () => {
    const { container } = render(<Button className="extra-class">Styled</Button>);
    expect(container.firstChild?.className).toContain("extra-class");
  });

  it("renders icon-only button", () => {
    render(<Button size="icon" aria-label="Settings"><span /></Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders with type submit", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("has accessible name via aria-label", () => {
    render(<Button aria-label="Close dialog">X</Button>);
    expect(screen.getByRole("button", { name: /close dialog/i })).toBeInTheDocument();
  });

  it("supports ref forwarding", () => {
    const ref = { current: null };
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
