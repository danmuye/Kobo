import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "../dialog";
import { Button } from "../button";

describe("Dialog", () => {
  it("opens and displays content when triggered", async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <p>Content</p>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByText("Test Dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /open/i }));
    await waitFor(() => {
      expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    });
  });

  it("closes when close button is clicked", async () => {
    render(
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Closable</DialogTitle>
          <p>Content</p>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Closable")).toBeInTheDocument();
    const closeButton = screen.getByRole("button", { name: /close/i });
    await userEvent.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByText("Closable")).not.toBeInTheDocument();
    });
  });

  it("fires onOpenChange callback", async () => {
    const handleOpenChange = vi.fn();
    render(
      <Dialog onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Test</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    await userEvent.click(screen.getByRole("button", { name: /open/i }));
    expect(handleOpenChange).toHaveBeenCalledWith(true);
  });

  it("renders dialog header, title, description and footer", async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description text</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button>Action</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    await waitFor(() => {
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Description text")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /action/i })).toBeInTheDocument();
    });
  });

  it("renders DialogClose child as functioning close button", async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>With Close</DialogTitle>
          <DialogClose asChild>
            <Button>Custom Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>,
    );
    await waitFor(() => {
      expect(screen.getByText("With Close")).toBeInTheDocument();
    });
  });
});
