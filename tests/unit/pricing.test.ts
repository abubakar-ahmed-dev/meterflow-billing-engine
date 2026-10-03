import { describe, it, expect } from "vitest";
import { CostCalculator } from "../../src/services/CostCalculator.js";

describe("CostCalculator Unit Tests (PROBE 5 & Pricing Math)", () => {
  it("bills cached input tokens at 25% of fresh input tokens (75% discount)", () => {
    const freshCost = CostCalculator.calculateTokenCost({ freshInput: 10_000 });
    const cachedCost = CostCalculator.calculateTokenCost({ cachedInput: 10_000 });

    const freshNano = BigInt(freshCost.costFreshInputNano);
    const cachedNano = BigInt(cachedCost.costCachedInputNano);

    // 10,000 * 2,000 = 20,000,000 nano-dollars ($0.02)
    expect(freshNano).toBe(20_000_000n);

    // 10,000 * 500 = 5,000,000 nano-dollars ($0.005) -> exactly 25% of fresh
    expect(cachedNano).toBe(5_000_000n);
    expect(cachedNano * 4n).toBe(freshNano);
  });

  it("bills reasoning tokens strictly at standard output token pricing", () => {
    const outputCost = CostCalculator.calculateTokenCost({ standardOutput: 5_000 });
    const reasoningCost = CostCalculator.calculateTokenCost({ reasoning: 5_000 });

    const outputNano = BigInt(outputCost.costOutputNano);
    const reasoningNano = BigInt(reasoningCost.costReasoningNano);

    // Both should equal 5,000 * 8,000 = 40,000,000 nano-dollars ($0.04)
    expect(outputNano).toBe(40_000_000n);
    expect(reasoningNano).toBe(40_000_000n);
    expect(reasoningNano).toBe(outputNano);
  });

  it("combines categories correctly without loss of precision", () => {
    const result = CostCalculator.calculateTokenCost({
      freshInput: 1_000_000,   // $2.00 = 2,000,000,000 nano
      cachedInput: 1_000_000,  // $0.50 = 500,000,000 nano
      standardOutput: 500_000, // $4.00 = 4,000,000,000 nano
      reasoning: 250_000,      // $2.00 = 2,000,000,000 nano
    });

    const expectedTotalNano =
      2_000_000_000n + 500_000_000n + 4_000_000_000n + 2_000_000_000n; // 8,500,000,000 nano ($8.50)

    expect(BigInt(result.totalCostNano)).toBe(expectedTotalNano);
    expect(result.formattedUsd).toBe("$8.500000");
    expect(result.totalCostCents).toBe(850);
  });

  it("handles zero usage without errors", () => {
    const result = CostCalculator.calculateTokenCost({});
    expect(result.totalCostNano).toBe("0");
    expect(result.totalTokens).toBe(0);
    expect(result.formattedUsd).toBe("$0.000000");
  });
});
