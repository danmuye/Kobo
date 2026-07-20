import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "../input";

describe("Input", () => {
  it("renders with placeholder", () => {
    render(<Input placeholder="Enter name" />);
    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
  });

  it("accepts value and onChange", async () => {
    const handleChange = vi.fn();
    render(<Input value="test" onChange={handleChange} />);
    const input = screen.getByDisplayValue("test");
    await userEvent.type(input, "a");
    expect(handleChange).toHaveBeenCalled();
  });

  it("applies disabled state", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("renders different types", () => {
    render(<Input type="number" />);
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Input className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("associates label via htmlFor", () => {
    render(
      <>
        <label htmlFor="test-input">Name</label>
        <Input id="test-input" />
      </>,
    );
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("displays required attribute", () => {
    render(<Input required />);
    expect(screen.getByRole("textbox")).toBeRequired();
  });

  it("supports ref forwarding", () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("handles readOnly", () => {
    render(<Input readOnly value="readonly" />);
    const input = screen.getByDisplayValue("readonly");
    expect(input).toHaveAttribute("readonly");
  });
});
