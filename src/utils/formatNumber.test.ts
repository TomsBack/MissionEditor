import { describe, expect, it } from "vitest";
import { formatNumber } from "./formatNumber";

describe("formatNumber", () => {
  it("formats integers with thousands separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(-9876)).toBe("-9,876");
  });

  it("formats floating-point numbers", () => {
    expect(formatNumber(1234.5)).toBe("1,234.5");
  });

  it("parses numeric strings", () => {
    expect(formatNumber("1000000")).toBe("1,000,000");
    expect(formatNumber("3.14")).toBe("3.14");
  });

  it("returns the raw input when value isn't finite", () => {
    expect(formatNumber("abc")).toBe("abc");
    expect(formatNumber(NaN)).toBe("NaN");
    expect(formatNumber(Infinity)).toBe("Infinity");
  });

  it("treats empty string as zero (Number(\"\") === 0)", () => {
    expect(formatNumber("")).toBe("0");
  });
});
