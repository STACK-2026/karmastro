import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SmartDateInput from "@/components/SmartDateInput";

describe("SmartDateInput", () => {
  it("reflète une valeur externe sans écraser une saisie partielle", () => {
    const onChange = vi.fn();
    const { rerender } = render(<SmartDateInput value="" onChange={onChange} placeholder="Date" />);
    const input = screen.getByPlaceholderText("Date");

    fireEvent.change(input, { target: { value: "12/0" } });
    rerender(<SmartDateInput value="" onChange={onChange} placeholder="Date" />);
    expect(input).toHaveValue("12/0");

    rerender(<SmartDateInput value="1990-12-25" onChange={onChange} placeholder="Date" />);
    expect(input).toHaveValue("25/12/1990");
  });

  it("conserve la saisie partielle au blur et affiche une erreur", () => {
    render(<SmartDateInput value="" onChange={vi.fn()} placeholder="Date" />);
    const input = screen.getByPlaceholderText("Date");

    fireEvent.change(input, { target: { value: "12/0" } });
    fireEvent.blur(input);

    expect(input).toHaveValue("12/0");
    expect(screen.getByText(/format/i)).toBeInTheDocument();
  });
});
