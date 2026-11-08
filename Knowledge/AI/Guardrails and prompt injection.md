---
type: concept
domain: AI
level: intermediate
tags: [concept, ai, security]
updated: 2026-11-08
---

# Guardrails and prompt injection

> **Prompt injection:** instructions hidden in content the model reads (a web page, a file, an invoice, a database row) that hijack what it does. **Guardrails** are checks around the model — on inputs, plans, tool calls or outputs — that block or flag unsafe behaviour. No guardrail is perfect; design so a fooled model can't do much.

## How it works
- **Direct** injection (the user) vs **indirect** (content the agent fetched).
- Defences, layered:
  - screen plans or tool calls before they run (a guard model, rules);
  - least-privilege tools: read-only accounts, allowlists ([[Least privilege and defence in depth]]);
  - human approval for side effects;
  - isolate code execution, limit network egress ([[AI agents and sandboxing]]);
  - never put secrets where the model can echo them; test for leaks.
- The **lethal trifecta**: private data + untrusted content + a way out → remove a leg.

## In our projects
- agent-runtime's optional **screen** step (`GUARDRAIL_ENABLED=true`) refuses unsafe plans (`refused` outcome); plans need approval by default ([[Agent runtime plans and outcomes]]).
- The evaluation's `INVOICE_WITH_INJECTION` fixture and security checks (`KeepsInstructionsPrivate`, `LeaksNoSecrets`) ([[Agent runtime evaluation]]).
- The toolbox fence and read-only MCP accounts ([[Homelab LLM and agent]]).

## Check yourself
1. Give an example of indirect prompt injection against our agent.
2. Which of our layers still holds if the screen step is fooled?

## Go further
- [OWASP Top 10 for LLM applications](https://genai.owasp.org/llm-top-10/).
- [Simon Willison: prompt injection](https://simonwillison.net/tags/prompt-injection/).
