# AI Token Economics and Pure Integer Financial Math

Modern artificial intelligence platforms measure workload in **tokens**—chunks of characters representing words, sub-words, and code syntax. As language models have evolved from simple text completion engines into multi-step reasoning agents, the pricing structure for tokens has grown increasingly sophisticated.

Token categories cannot simply be summed into a single integer. Input tokens, cached prompt tokens, standard output tokens, and chain-of-thought reasoning tokens each possess distinct infrastructure costs and pricing multipliers. Furthermore, calculating fractional costs per token exposes software systems to the classic hazards of computer arithmetic.

This guide outlines the mathematical principles used by MeterFlow to achieve exact, auditable billing for modern AI workloads.

---

## The Hazards of Floating-Point Arithmetic in Financial Code

A pervasive error in software engineering is utilizing standard floating-point data types (such as JavaScript `Number` or Python `float`) to store financial amounts.

In modern microprocessors, floating-point numbers are implemented according to the **IEEE 754 binary standard**. Because computers represent numbers in base-2 (binary) rather than base-10 (decimal), common decimal fractions cannot be represented with exact precision:
```javascript
// In standard floating-point arithmetic:
0.1 + 0.2 === 0.30000000000000004 // Evaluates to false!
```

When billing high-velocity AI APIs that process millions of tokens per second, fractional rounding errors accumulate rapidly. Over thousands of customer accounts and millions of transactions, these tiny inaccuracies cause billing statements to disagree with raw event logs, failing financial audits and complicating reconciliation.

### The Integer Micro-Unit Solution
MeterFlow eliminates binary rounding drift entirely by enforcing an **Integer Arithmetic Rule**: money is never represented as a floating-point number.

Instead, currency is stored using high-precision integer scaling:
- **Base Unit**: **Nano-Dollars** ($1\text{ USD} = 1,000,000,000\text{ nano-units}$).
- **Database Storage**: Tracked as **Micro-Cents** ($1\text{ Cent} = 10,000\text{ micro-cents}$, or $1\text{ USD} = 1,000,000\text{ micro-cents}$) stored in standard PostgreSQL `BIGINT` columns.
- **Node.js Runtime**: Computed using native `BigInt` operations, guaranteeing zero fractional loss during multiplication and division.

---

## The Economics of AI Token Categories

Frontier language models (such as Google Gemini, Anthropic Claude, and OpenAI GPT-4o) employ asymmetric pricing across four distinct token categories:

### 1. Fresh Input Tokens
These represent the raw user prompt, instructions, and context sent to the model for the first time. The compute cluster must evaluate the full attention matrix across these tokens.
- **Pinned Rate**: **\$2.00 per 1,000,000 tokens** ($2,000\text{ nano-dollars}$ per token).

### 2. Cached Input Tokens (Prompt Caching)
When an application repeatedly passes large static system instructions, documents, or conversation history, modern AI inference providers cache the key-value (KV) attention states in GPU memory. Re-evaluating cached tokens requires significantly less GPU compute than processing fresh tokens.
- **Pinned Rate**: **\$0.50 per 1,000,000 tokens** ($500\text{ nano-dollars}$ per token).
- **The Discount**: This reflects a **75% discount** relative to the fresh input rate. A billing engine that fails to track cached tokens separately will overcharge customers by a factor of four.

### 3. Standard Output Tokens
These are the generated tokens streamed back to the client. Autoregressive token generation requires sequential matrix multiplications for every individual token, making output generation substantially more resource-intensive than input ingestion.
- **Pinned Rate**: **\$8.00 per 1,000,000 tokens** ($8,000\text{ nano-dollars}$ per token).

### 4. Reasoning / Thinking Tokens
Advanced reasoning models produce internal chain-of-thought tokens to plan and self-correct before presenting their final answer. Although these "thinking tokens" are often hidden from the end-user interface, they consume identical GPU compute cycles as standard output tokens.
- **Pinned Accounting Rule**: Reasoning tokens are billed strictly at the **standard output token rate** (\$8.00 per 1M tokens). They are never treated as free or discounted input.

---

## The Mathematical Cost Formula

To calculate the cost of a billable AI generation request, MeterFlow executes pure integer multiplication and summation:

$$\text{Cost}_{\text{nano}} = (T_{\text{fresh}} \times 2,000) + (T_{\text{cached}} \times 500) + ((T_{\text{output}} + T_{\text{reasoning}}) \times 8,000)$$

### Concrete Verification Example

Suppose a customer generates an AI response with the following usage vector:
- **Fresh Input ($T_{\text{fresh}}$)**: $1,000,000$ tokens
- **Cached Input ($T_{\text{cached}}$)**: $1,000,000$ tokens
- **Standard Output ($T_{\text{output}}$)**: $500,000$ tokens
- **Reasoning Tokens ($T_{\text{reasoning}}$)**: $250,000$ tokens

Using the integer pricing constants:
1. $\text{Cost}_{\text{fresh}} = 1,000,000 \times 2,000\text{ n\$} = 2,000,000,000\text{ n\$} = \$2.000000$
2. $\text{Cost}_{\text{cached}} = 1,000,000 \times 500\text{ n\$} = 500,000,000\text{ n\$} = \$0.500000$
3. $\text{Cost}_{\text{output}} = 500,000 \times 8,000\text{ n\$} = 4,000,000,000\text{ n\$} = \$4.000000$
4. $\text{Cost}_{\text{reasoning}} = 250,000 \times 8,000\text{ n\$} = 2,000,000,000\text{ n\$} = \$2.000000$

$$\text{Total Cost} = 2.00 + 0.50 + 4.00 + 2.00 = \$8.500000\text{ USD}$$
$$\text{Total Nano-Dollars} = 8,500,000,000\text{ n\$}$$
$$\text{Total Integer Cents} = 850\text{ cents}$$

Because all operations are performed with `BigInt`, this result is computed with zero floating-point approximation error.
