import { PRICING_CONFIG, TokenUsageInput, CostBreakdown } from "../config/pricing.js";

export class CostCalculator {
  /**
   * Calculates total cost using pure integer BigInt arithmetic.
   * Enforces rules:
   * 1. Cached input tokens are billed at 25% of fresh input.
   * 2. Reasoning tokens count strictly as output tokens.
   * 3. Different token classes are scaled individually.
   */
  public static calculateTokenCost(tokens: TokenUsageInput): CostBreakdown {
    const freshInput = BigInt(Math.max(0, tokens.freshInput || 0));
    const cachedInput = BigInt(Math.max(0, tokens.cachedInput || 0));
    const standardOutput = BigInt(Math.max(0, tokens.standardOutput || 0));
    const reasoning = BigInt(Math.max(0, tokens.reasoning || 0));

    const nanoConfig = PRICING_CONFIG.NANO_DOLLARS;

    const costFreshInput = freshInput * nanoConfig.FRESH_INPUT_PER_TOKEN;
    const costCachedInput = cachedInput * nanoConfig.CACHED_INPUT_PER_TOKEN;
    const costStandardOutput = standardOutput * nanoConfig.STANDARD_OUTPUT_PER_TOKEN;
    const costReasoning = reasoning * nanoConfig.REASONING_OUTPUT_PER_TOKEN;

    const totalCostNano = costFreshInput + costCachedInput + costStandardOutput + costReasoning;

    // Convert nano-dollars to cents (rounding up to nearest cent or exact integer division)
    const totalCostCents = Number((totalCostNano + nanoConfig.NANO_PER_CENT - 1n) / nanoConfig.NANO_PER_CENT);

    // Formatted representation
    const dollars = Number(totalCostNano) / Number(nanoConfig.NANO_PER_USD);

    return {
      freshInputTokens: Number(freshInput),
      cachedInputTokens: Number(cachedInput),
      standardOutputTokens: Number(standardOutput),
      reasoningTokens: Number(reasoning),
      totalTokens: Number(freshInput + cachedInput + standardOutput + reasoning),
      costFreshInputNano: costFreshInput.toString(),
      costCachedInputNano: costCachedInput.toString(),
      costOutputNano: costStandardOutput.toString(),
      costReasoningNano: costReasoning.toString(),
      totalCostNano: totalCostNano.toString(),
      totalCostCents,
      formattedUsd: `$${dollars.toFixed(6)}`,
    };
  }

  /**
   * Calculates API call cost in nano-dollars
   */
  public static calculateApiCallCost(apiCalls: number): bigint {
    return BigInt(Math.max(0, apiCalls)) * PRICING_CONFIG.API_CALLS.PER_CALL_NANO_DOLLARS;
  }
}
