import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "../ErrorBoundary";

const ThrowError = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("renders default fallback on error", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowError message="Test error" />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("renders custom fallback when provided", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowError message="Error" />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Custom error UI")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("clears error state on retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let shouldThrow = true;
    function ConditionalThrow() {
      if (shouldThrow) throw new Error("Temp error");
      return <p>Recovered</p>;
    }
    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Temp error")).toBeInTheDocument();
    shouldThrow = false;
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(screen.getByText("Recovered")).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("has role alert in error state", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowError message="Alert test" />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
