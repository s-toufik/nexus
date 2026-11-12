---
type: concept
domain: AI
level: intermediate
tags: [concept, ai, security]
updated: 2026-11-08
---

# AI agents and sandboxing

> An **agent** is a loop: the model reads the task and the conversation, decides to call a tool, sees the result, and repeats until it can answer. Because the model's decisions can be wrong or manipulated, what the tools can reach must be limited — a **sandbox**.

## Why it matters
Agents turn text into actions. A single malicious instruction hidden in a web page, a file or a database row (**prompt injection**) can make the model use its tools against you. Senior engineers design agents assuming the model will, at some point, do the wrong thing.

## How it works
- **Loop**: messages → model → `tool_calls` → run tools → append results → model … → final answer ([[OpenAI-compatible API]]).
- **Tools** come from MCP servers or code ([[Model Context Protocol]]).
- **The lethal trifecta** (Simon Willison): access to private data + exposure to untrusted content + a way to send data out = exfiltration risk. Remove at least one leg.
- **Sandboxing**: run generated code in an isolated environment — containers, no credentials, network allow-lists, read-only data access, resource limits, timeouts.
- **Human in the loop** for destructive actions.

## In our projects
- agent-runtime runs the loop; agent-toolbox runs tools and a Python executor in its own pod ([[Homelab LLM and agent]]).
- The fence: [[NetworkPolicy]] denies databases, Kafka, the LLM, private ranges and the cloud metadata range; data only through MCP servers with **read-only** accounts by default; the switch to write is a deploy ([[Homelab decisions]]).
- The pod is hardened ([[Pod security context]]) and has no Kubernetes token.

## Check yourself
1. Name the three legs of the lethal trifecta in our agent. Which one is weakest?
> [!success]- Answer
> Private data: the databases and Grafana, read through the MCP servers. Untrusted content: tool results such as logs, rows and files, written by people or programs the agent doesn't control. A way out: the toolbox pod may reach the public internet. That last leg is the weakest: only plan approval and the screen step stand between a hijacked plan and a request carrying your data out.
2. Why are read-only database accounts a sandbox measure, not just a permission detail?
> [!success]- Answer
> A sandbox limits what a fooled model can do, not what it intends. With a read-only account, the worst an injected instruction can do to the data is read it: it can't delete, change or encrypt it, whatever the model decides. The limit is enforced by the database, outside the model's reach.

## Go further
- [Anthropic: building effective agents](https://www.anthropic.com/research/building-effective-agents).
- [Simon Willison: the lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/).
- [OWASP Top 10 for LLM applications](https://genai.owasp.org/llm-top-10/).
