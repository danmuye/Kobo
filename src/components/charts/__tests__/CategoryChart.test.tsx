import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryChart } from "../CategoryChart";

describe("CategoryChart", () => {
  it("renders pie chart with data", () => {
    const data = [
      { name: "Food", value: 5000 },
      { name: "Transport", value: 3000 },
    ];
    const { container } = render(<CategoryChart data={data} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders legend items", () => {
    const data = [
      { name: "Food", value: 5000 },
      { name: "Transport", value: 3000 },
    ];
    render(<CategoryChart data={data} />);
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Transport")).toBeInTheDocument();
  });

  it("renders empty pie chart with no data", () => {
    const { container } = render(<CategoryChart data={[]} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies custom height", () => {
    const data = [{ name: "Food", value: 100 }];
    const { container } = render(<CategoryChart data={data} height={300} />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.style.height).toBe("300px");
  });
});
