import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { RHFInput, RHFSelect, RHFTextArea } from "../fields";
import { Button } from "@/components/ui/button";

const testSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  notes: z.string().optional(),
});

type TestValues = z.infer<typeof testSchema>;

function TestForm({
  onSubmit = vi.fn(),
  defaultValues = { name: "", category: "", notes: "" },
}: {
  onSubmit?: (values: TestValues) => void;
  defaultValues?: TestValues;
}) {
  const form = useForm<TestValues>({
    resolver: zodResolver(testSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <RHFInput control={form.control} name="name" label="Name" placeholder="Enter name" />
        <RHFSelect control={form.control} name="category" label="Category" options={[
          { label: "Food", value: "food" },
          { label: "Transport", value: "transport" },
        ]} />
        <RHFTextArea control={form.control} name="notes" label="Notes" placeholder="Add notes" rows={3} />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}

describe("RHFInput", () => {
  it("renders label and input", () => {
    render(<TestForm />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
  });

  it("displays validation error", async () => {
    render(<TestForm />);
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });
  });

  it("accepts input and submits", async () => {
    const onSubmit = vi.fn();
    render(<TestForm onSubmit={onSubmit} defaultValues={{ name: "", category: "food", notes: "" }} />);
    await userEvent.type(screen.getByPlaceholderText("Enter name"), "Test");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Test" }),
        expect.anything(),
      );
    });
  });
});

describe("RHFSelect", () => {
  it("renders label and options", async () => {
    render(<TestForm />);
    expect(screen.getAllByText("Category").length).toBeGreaterThan(0);
    const trigger = screen.getByRole("combobox");
    await userEvent.click(trigger);
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /food/i })).toBeInTheDocument();
    });
  });

  it("selects value and submits", async () => {
    const onSubmit = vi.fn();
    render(<TestForm onSubmit={onSubmit} defaultValues={{ name: "Test", category: "", notes: "" }} />);
    await userEvent.click(screen.getByRole("combobox"));
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /food/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole("option", { name: /food/i }));
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it("displays validation error when required", async () => {
    render(<TestForm />);
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByText("Category is required")).toBeInTheDocument();
    });
  });
});

describe("RHFTextArea", () => {
  it("renders label and textarea", () => {
    render(<TestForm />);
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Add notes")).toBeInTheDocument();
  });

  it("accepts input", async () => {
    render(<TestForm />);
    const textarea = screen.getByPlaceholderText("Add notes");
    await userEvent.type(textarea, "Some notes");
    expect(textarea).toHaveValue("Some notes");
  });
});
