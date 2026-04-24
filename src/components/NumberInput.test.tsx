import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NumberInput } from "./NumberInput";

function setup(props: Partial<React.ComponentProps<typeof NumberInput>> = {}) {
  const onChange = vi.fn();
  const utils = render(<NumberInput value={0} onChange={onChange} {...props} />);
  const input = screen.getByRole("spinbutton") as HTMLInputElement;
  return { ...utils, onChange, input };
}

describe("NumberInput", () => {
  it("renders the initial value as a string", () => {
    const { input } = setup({ value: 42 });
    expect(input.value).toBe("42");
  });

  it("emits parsed integers in int mode", () => {
    const { input, onChange } = setup({ value: 0 });
    fireEvent.change(input, { target: { value: "5" } });
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it("truncates floats to integers in int mode", () => {
    const { input, onChange } = setup({ value: 0 });
    fireEvent.change(input, { target: { value: "3.7" } });
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it("keeps the fractional part in float mode", () => {
    const { input, onChange } = setup({ value: 0, float: true });
    fireEvent.change(input, { target: { value: "3.7" } });
    expect(onChange).toHaveBeenLastCalledWith(3.7);
  });

  it("commits scientific notation as the full numeric value", () => {
    const { input, onChange } = setup({ value: 0 });
    fireEvent.change(input, { target: { value: "1e5" } });
    expect(onChange).toHaveBeenLastCalledWith(100000);
  });

  it("does not call onChange for partial input that isn't yet a number", () => {
    const { input, onChange } = setup({ value: 0 });
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.change(input, { target: { value: "-" } });
    fireEvent.change(input, { target: { value: "." } });
    fireEvent.change(input, { target: { value: "-." } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clamps to min", () => {
    const { input, onChange } = setup({ value: 5, min: 0 });
    fireEvent.change(input, { target: { value: "-10" } });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it("clamps to max", () => {
    const { input, onChange } = setup({ value: 5, max: 100 });
    fireEvent.change(input, { target: { value: "999" } });
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it("restores the canonical value on blur after partial input", () => {
    const { input } = setup({ value: 7 });
    fireEvent.change(input, { target: { value: "" } });
    expect(input.value).toBe("");
    fireEvent.blur(input);
    expect(input.value).toBe("7");
  });

  it("renders 0 (not 'NaN') when parent passes NaN", () => {
    const { input } = setup({ value: NaN });
    expect(input.value).toBe("0");
  });

  it("renders 0 when parent passes Infinity", () => {
    const { input } = setup({ value: Infinity });
    expect(input.value).toBe("0");
  });

  it("respects the disabled prop", () => {
    const { input } = setup({ disabled: true });
    expect(input.disabled).toBe(true);
  });

  it("forwards the step prop", () => {
    const { input } = setup({ step: 0.5 });
    expect(input.getAttribute("step")).toBe("0.5");
  });
});
