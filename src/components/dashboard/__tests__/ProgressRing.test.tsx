import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ProgressRing } from "../ProgressRing";

describe("ProgressRing", () => {
  it("renders SVG circle", () => {
    const { container } = render(<ProgressRing percentage={50} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(2);
  });

  it("handles 0%", () => {
    const { container } = render(<ProgressRing percentage={0} />);
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(2);
  });

  it("handles 100%", () => {
    const { container } = render(<ProgressRing percentage={100} />);
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(2);
  });

  it("handles values over 100% by clamping", () => {
    const { container } = render(<ProgressRing percentage={150} />);
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(2);
  });

  it("handles negative values by clamping to 0", () => {
    const { container } = render(<ProgressRing percentage={-10} />);
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(2);
  });

  it("accepts custom size and strokeWidth", () => {
    const { container } = render(<ProgressRing percentage={50} size={64} strokeWidth={6} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "64");
    expect(svg).toHaveAttribute("height", "64");
  });
});
