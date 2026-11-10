---
type: path
track: Applications
time: ~8 h
projects: ["[[Agent runtime]]", "[[Agent toolbox]]", "[[pycraftcore]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Design that lasts

> **Goal:** understand — and be able to defend — the shape every service here shares: hexagonal layers, dependency injection, tests that guard the design.
> **Time:** ~8 h.
> **Before:** [[Path - Python for services]]. **Then:** [[Path - Serving HTTP well]] · [[Path - Agents]]. **All paths:** [[Paths]]

## Warm-up (optional, from the paths before)
1. Which file in agent-runtime decides which model each step uses?
> [!success]- Answer
> `config/<env>/operation/agent.yml` (with `operation/llm.yml` listing the models).

## 1. Ports and adapters · ~2 h
**Read:** [[Hexagonal architecture]] · [[Agent runtime layers]]

**Do:**
1. 👀 In agent-runtime: `ls src/agent_runtime/application/port/outbound/` → what the core needs (`actor.py`, `planner.py`, `tool_executor.py`, `workflow_runner.py`…). Open `tool_executor.py`: one method, `async def run(self, call: ToolCall) -> ToolResult`. Then open `src/agent_runtime/adapter/outbound/tool/toolbox.py`: class `Toolbox` has the same `run`, and never names `ToolExecutor` — Python `Protocol`s match by shape, so the adapter doesn't even import the port.
2. 👀 `grep -rn "^import\|^from" src/agent_runtime/domain | grep -v agent_runtime | sort -u` → the domain imports only the standard library.
3. Draw agent-runtime's four rings with two adapters on each side.

**Check:**
1. `Toolbox` never mentions `ToolExecutor`. How does the type checker know it fits?
> [!success]- Answer
> `ToolExecutor` is a `typing.Protocol`: any class with a matching `async def run(self, call: ToolCall) -> ToolResult` satisfies it (structural typing). Where `AgentDI` passes a `Toolbox` to a step expecting a `ToolExecutor`, `ty` checks the shapes match.

2. LangGraph runs the steps. Why mustn't the domain import it?
> [!success]- Answer
> So the rules (routing, plans, turns) don't depend on a fast-moving library: they can be tested without it, and the engine can be replaced (the scenario tests already run the same steps on a plain loop).

## 2. Wiring: dependency injection · ~1.5 h
**Read:** [[Dependency injection]] · [[Agent toolbox layers]]

**Do:**
1. 👀 Read `src/bootstrap/di/` in agent-toolbox (`ToolboxDI`): list what it builds, in order.
2. 👀 Find where a route receives a service in agent-runtime's `src/bootstrap/application/litestar/`.

**Check:**
1. What's a composition root, and why only one?
> [!success]- Answer
> The single place that chooses concrete classes and connects them (`ToolboxDI`, `AgentDI`). With one, every other class receives its dependencies and stays testable; wiring scattered across classes hides what depends on what.

## 3. Data behind interfaces · ~45 min
**Read:** [[Repository pattern]] · [[pycraftcore - Use databases and SQL]]

**Check:**
1. Where do a repository's interface and its SQLite implementation live, in hexagonal terms?
> [!success]- Answer
> The interface (port) in the application layer, owned by the code that needs it; the SQLite implementation in an outbound adapter.

## 4. Tests that guard behaviour · ~2 h
**Read:** [[Unit tests and test doubles]] · [[Agent runtime - Test and check]]

**Do:**
1. In agent-runtime: `make test` → all green, no model called.
2. 👀 Open `tests/agent_runtime/scenarios/test_turn_scenarios.py`: find a scripted model and the route it forces.
3. 👀 In agent-toolbox: `tests/contract/test_tool_parity.py` → what "parity" means.

**Check:**
1. What do the scenario tests prove by running the same turns on LangGraph *and* a plain loop?
> [!success]- Answer
> That the behaviour comes from the steps and `TurnPolicy`, not from LangGraph: both runners must produce the same answers, events and stored conversation.

## 5. Tests that guard the design · ~1.5 h
**Read:** [[Architecture tests]]

**Do** ✋ (undo given):
1. In agent-runtime, add `import langgraph` at the top of `src/agent_runtime/domain/workflow/conditions.py`.
2. `uv run pytest tests/architecture -q` → fails, naming the file and the forbidden import.
3. Undo: `git restore src/agent_runtime/domain/workflow/conditions.py`.

**Check:**
1. Why is an architecture test better than a review checklist?
> [!success]- Answer
> It runs on every change, never gets tired, and fails the build at the exact line; reviewers miss "just one" convenient import, and layers erode that way.

**Milestone:** you can explain why our services are hexagonal, show where each ring is, and prove a boundary is enforced.
