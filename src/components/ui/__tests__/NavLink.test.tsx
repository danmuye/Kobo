import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NavLink } from "@/components/NavLink";

describe("NavLink", () => {
  it("renders with the correct href", () => {
    render(
      <MemoryRouter>
        <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: /dashboard/i });
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  it("applies base className", () => {
    render(
      <MemoryRouter>
        <NavLink to="/test" className="base-class">Test</NavLink>
      </MemoryRouter>,
    );
    expect(screen.getByText("Test").className).toContain("base-class");
  });

  it("adds active class when active", () => {
    render(
      <MemoryRouter initialEntries={["/active"]}>
        <NavLink to="/active" activeClassName="active-class">Active</NavLink>
      </MemoryRouter>,
    );
    const link = screen.getByText("Active");
    expect(link.className).toContain("active-class");
  });

  it("does not set aria-current when inactive", () => {
    render(
      <MemoryRouter initialEntries={["/other"]}>
        <NavLink to="/inactive">Inactive</NavLink>
      </MemoryRouter>,
    );
    expect(screen.getByText("Inactive")).not.toHaveAttribute("aria-current");
  });

  it("forwards ref", () => {
    const ref = { current: null };
    render(
      <MemoryRouter>
        <NavLink to="/ref" ref={ref}>Ref Link</NavLink>
      </MemoryRouter>,
    );
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });
});
