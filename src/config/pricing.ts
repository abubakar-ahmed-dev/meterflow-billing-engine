/**
 * Pinned Token & Usage Pricing Constants
 * 
 * Money is strictly stored as integers in MICRO-UNITS to eliminate floating-point drift:
 * 1 USD = 100 Cents = 1,000,000 Micro-Units (1 Micro-Unit = $0.000001 USD = 0.0001 cents)
 * 
 * Pricing rules based on frontier LLM specifications (Gemini / Claude / OpenAI):
 * 1. Cached input tokens are billed at 25% of fresh input tokens (75% discount).
 * 2. Reasoning / thinking tokens are counted and billed strictly as standard output tokens.
 * 3. Token categories cannot be naively summed; each category is multiplied by its pinned unit price.
 */

export const PRICING_CONFIG = {
  CURRENCY: "USD",
  MICRO_UNITS_PER_USD: 1_000_000n,
  MICRO_UNITS_PER_CENT: 10_000n,

  // Prices per token in integer micro-units ($0.000001 per unit)
  TOKENS: {
    // $2.00 per 1,000,000 fresh input tokens -> 2 micro-units per token
    FRESH_INPUT_MICRO_UNITS: 2n,

    // $0.50 per 1,000,000 cached input tokens (75% discount) -> 0.5 unit per token.
    // To ensure exact integer math without halves, we define scale factor of 10,000:
    // Scale factor: BASE_SCALE = 1,000,000,000 (nano-dollars)
  },

  // Highly precise integer scale: 1 Nano-Dollar = $0.000000001 USD
  NANO_DOLLARS: {
    FRESH_INPUT_PER_TOKEN: 2_000n,       // $2.00 per 1M tokens ($0.000002000 / token)
    CACHED_INPUT_PER_TOKEN: 500n,        // $0.50 per 1M tokens ($0.000000500 / token - 75% discount)
    STANDARD_OUTPUT_PER_TOKEN: 8_000n,   // $8.00 per 1M tokens ($0.000008000 / token)
    REASONING_OUTPUT_PER_TOKEN: 8_000n,  // Reasoning tokens = Output rate ($0.000008000 / token)
    NANO_PER_CENT: 10_000_000n,          // 10 million nano-dollars = 1 cent
    NANO_PER_USD: 1_000_000_000n,        // 1 billion nano-dollars = $1.00 USD
  },

  // API Call pricing (for overage / cost calculation)
  API_CALLS: {
    PER_CALL_NANO_DOLLARS: 10_000n,      // $0.000010 per standard API call ($10 per 1M calls)
  },
} as const;

export interface TokenUsageInput {
  freshInput?: number;
  cachedInput?: number;
  standardOutput?: number;
  reasoning?: number;
}

export interface CostBreakdown {
  freshInputTokens: number;
  cachedInputTokens: number;
  standardOutputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  costFreshInputNano: string;
  costCachedInputNano: string;
  costOutputNano: string;
  costReasoningNano: string;
  totalCostNano: string;
  totalCostCents: number;
  formattedUsd: string;
}
