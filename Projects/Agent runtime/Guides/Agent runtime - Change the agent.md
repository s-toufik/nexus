---
type: guide
project: "[[Agent runtime]]"
tags: [guide, agent-runtime]
updated: 2026-11-08
---

# Agent runtime - Change the agent

> Where to edit for each kind of change: routing, a step, a prompt, a request option, a route, a step, a model role, a source of tools.

**Where:** on your Mac, in `agent-runtime` · **All guides:** [[Agent runtime guides]]

| To change | Edit |
|---|---|
| When a step follows another | `TurnPolicy` (and a condition in `conditions.py`); the graph follows |
| What a step does | Its handler in `application/step/` |
| What a model is told | `adapter/outbound/llm/langchain/prompts/` |
| What the client sees for a step | `adapter/inbound/web/stream/sse_presenter.py` |
| A LangGraph-only feature for one step (interrupt, subgraph) | Override `work` in that step's node in `adapter/outbound/langgraph/node/` |
| A new request option | `AgentRequestSchema` (`bootstrap/application/fastapi/schema/`) → `AgentRequest` → `TurnOptions`, read in the domain |
| A new route | A function in a router of `bootstrap/application/fastapi/router/`, listed in `fastapi_api.py`. A service it needs comes in as a provider (`Callable[[], Service]`) given by the container in `create_agent_application` |
| Which task state an outcome gives an A2A client | `TaskState.of` in `domain/a2a/task_state.py` |
| A new step | A `Step` value, a handler in `application/step/`, a node class in `langgraph/node/` listed in `NODE_TYPES`, the handler in `AgentDI._steps`, and its rows in `TurnPolicy` |
| A new model role | An `AgentRole` value, its entry in `operation/agent.yml` (and `root.yml`), and a LangChain adapter behind the step's port |
| A new source of tools | A connector in `connector/mcp.yml` (see [[Agent runtime - Configure it]]); a non-MCP source is a new adapter behind the `ToolCatalog` and `ToolExecutor` ports |

After any change: [[Agent runtime - Test and check]].

## Why it works
- [[Agent runtime turn]] — the routing table and how the graph follows it.
- [[Agent runtime layers]] · [[Hexagonal architecture]] · [[LangGraph]]
