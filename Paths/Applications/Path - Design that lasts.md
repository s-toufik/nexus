---
type: path
track: Applications
time: ~9 h
projects: ["[[Agent runtime]]", "[[Agent toolbox]]", "[[pycraftcore]]", "[[Homelab UI]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Design that lasts

> **Goal:** understand — and be able to defend — the shape every service here shares: hexagonal layers, dependency injection, data behind interfaces, and tests that guard both behaviour and design.
> **Time:** ~9 h.
> **Before:** [[Path - Python for services]]. **Then:** [[Path - Serving HTTP well]] · [[Path - Agents]]. **All paths:** [[Paths]]

## Principles → projects
| Principle | Where it lives in our projects |
|---|---|
| Ports and adapters | agent-runtime `application/port/outbound/` + `adapter/`; toolbox `Tool` + `ToolBinder`/`SandboxToolBridge`; pycraftcore `<module>/port/` |
| Structural vs nominal interfaces | agent-runtime's `Protocol` ports; the toolbox's `Tool` ABC |
| Composition root | `AgentDI`, `ToolboxDI`, homelab-ui's `app.config.ts` |
| Repository pattern | pycraftcore `AsyncRepository` |
| Tests with doubles | scripted models; fake MCP sessions |
| Architecture tests | `tests/architecture/test_boundaries.py` |

## Warm-up (optional)
1. Which file in agent-runtime decides which model each step uses?
> [!success]- Answer
> `config/<env>/operation/agent.yml` (models listed in `operation/llm.yml`).

## 1. Ports and adapters · ~2.5 h

### Learn
**Definitions**
- **Domain** — the business rules and models, no framework ([[Hexagonal architecture]]).
- **Application / use case** — what the system does, orchestrating the domain through ports.
- **Port** — an interface the application owns: *inbound* (what it offers: `HandleMessagePort`) or *outbound* (what it needs: `Planner`, `ToolExecutor`).
- **Adapter** — a port implemented with a technology (LangChain, MCP, LangGraph, Litestar).
- **Dependency rule** — source dependencies point inward only.
- **Structural typing** — a class satisfies a `typing.Protocol` by having the right methods, without naming it. **Nominal typing** — it must inherit (an ABC).

**How it works**
```text
inbound adapters ─► inbound ports ─► use cases + domain ─► outbound ports ◄─ outbound adapters
(controller, MCP)                                                           (LangChain, MCP client, DB)
```
The core can be tested with fakes and keeps working when a library is replaced.

**Example from our projects** — an outbound port and its adapter in agent-runtime:
```python
class ToolExecutor(Protocol):
    async def run(self, call: ToolCall) -> ToolResult: ...
```
```python
class Toolbox:
    async def run(self, call: ToolCall) -> ToolResult: ...
```
`application/port/outbound/tool_executor.py` and `adapter/outbound/tool/toolbox.py`. `Toolbox` never imports `ToolExecutor`: it matches by shape. Compare the toolbox's port, an ABC tools must *inherit*:
```python
class Tool[I: BaseModel, O: BaseModel](ABC):
    name: str
    description: str
    input_model: type[I]
    output_model: type[O]
    @abstractmethod
    async def run(self, arguments: I) -> O: ...
```
Protocol: lighter, adapters stay independent. ABC: shared attributes, a clear "this is a tool" — and the generic parameters tie each tool to its models.

**Common mistake** — a port that returns a library type (a LangChain message): the core is tied to the library again.

### Do
1. 👀 agent-runtime: `ls src/agent_runtime/application/port/outbound/`; open `tool_executor.py` and `adapter/outbound/tool/toolbox.py`.
2. 👀 `grep -rhn "^import\|^from" src/agent_runtime/domain | grep -v agent_runtime | sort -u` → standard library only.
3. Draw agent-runtime's four rings with two adapters on each side.

### Check
1. `Toolbox` never mentions `ToolExecutor`. How does the type checker know it fits?
> [!success]- Answer
> `ToolExecutor` is a `Protocol`: any class with a matching `async def run(self, call: ToolCall) -> ToolResult` satisfies it. Where `AgentDI` passes a `Toolbox` where a `ToolExecutor` is expected, `ty` checks the shapes.

2. LangGraph runs the steps. Why mustn't the domain import it?
> [!success]- Answer
> So the rules don't depend on a fast-moving library: they're testable without it, and the engine is replaceable (the scenarios already run on a plain loop).

## 2. Wiring: dependency injection · ~2 h

### Learn
**Definitions**
- **Dependency injection** — objects receive their dependencies instead of building them ([[Dependency injection]]).
- **Composition root** — the single place choosing concrete classes and connecting them.
- **Framework DI** — Litestar's `dependencies={…: Provide(…)}`, FastAPI's `Depends`, Angular's `inject()`.

**How it works**
At start-up the composition root reads the configuration, builds adapters (clients, repositories, models), builds the use cases with them, and hands entry points to the web framework, which injects them into routes.

**Example from our projects** — agent-runtime hands its controller to Litestar's DI (`litestar_api.py`):
```python
dependencies={
    "agent": Provide(agent, sync_to_thread=False),
    "models": Provide(models, sync_to_thread=False),
},
```
and in the toolbox, `InvokeToolUseCase` receives its tools — it doesn't know which exist:
```python
class InvokeToolUseCase:
    def __init__(self, tools: Iterable[Tool], logger: Logger) -> None:
        self._tools: dict[str, Tool] = {tool.name: tool for tool in tools}
        self._logger = logger
```

**Common mistake** — a class building its own client "for convenience" (`httpx.AsyncClient()` inside a step): now it can't be faked in tests, and its settings live in two places.

### Do
👀 agent-toolbox `src/bootstrap/di/` (`ToolboxDI`): list what it builds, in order.

### Check
1. What's a composition root, and why only one?
> [!success]- Answer
> The single place that chooses concrete classes and connects them. With one, every other class receives its dependencies and stays testable; scattered wiring hides what depends on what.

## 3. Data behind interfaces · ~1 h

### Learn
**Definitions**
- **Repository** — an interface speaking the application's language for storage; implementations per database ([[Repository pattern]]).
- **`@runtime_checkable`** — lets `isinstance()` check a Protocol at runtime.

**Example from our projects** — pycraftcore's port:
```python
@runtime_checkable
class AsyncRepository(Protocol):
    async def execute(self, query: str, parameters: tuple[Any, ...] = ()) -> list[dict[str, Any]]: ...
```
SQLite (pooled), PostgreSQL and MongoDB adapters implement it; a service gets one from a factory built from its database connector.

**Common mistake** — SQL strings scattered in use cases: tied to one database, untestable without it.

### Check
1. In hexagonal terms, where do a repository's interface and its SQLite implementation live?
> [!success]- Answer
> Interface in the application (owned by the code that needs it); implementation in an outbound adapter.

## 4. Tests that guard behaviour · ~2 h

### Learn
**Definitions**
- **Unit test** — one behaviour, fast, isolated ([[Unit tests and test doubles]]).
- **Test double** — stub, fake, mock, or a **scripted model** returning prepared outputs.
- **Scenario test** — a whole turn end to end, with doubles at the edges.
- **Contract test** — two implementations or paths must give the same result.

**How it works** — because the core only sees ports, tests plug in doubles: agent-runtime's scenarios run every route of `TurnPolicy` with scripted models, on LangGraph *and* a plain loop; the toolbox's parity test runs each tool directly and through the sandbox bridge.

**Example from our projects**
```text
agent-runtime/tests/agent_runtime/scenarios/test_turn_scenarios.py   whole turns, two runners
agent-toolbox/tests/contract/test_tool_parity.py                     same result by both doors
```

**Common mistake** — tests that call a real model: slow, costly, flaky, and they can't reach rare routes on demand.

### Do
1. agent-runtime: `make test` → green, no model called.
2. 👀 `test_turn_scenarios.py`: find a scripted model and the route it forces.

### Check
1. What do the scenario tests prove by running on two runners?
> [!success]- Answer
> That behaviour comes from the steps and `TurnPolicy`, not from LangGraph: both runners must give the same answers, events and stored conversation.

## 5. Tests that guard the design · ~1.5 h

### Learn
**Definitions**
- **Architecture test** — checks the code's structure: forbidden imports per layer ([[Architecture tests]]).
- **AST** — the parsed structure of source code; the test reads imports from it.

**Example from our projects** — agent-runtime's forbidden list for the core (`tests/architecture/test_boundaries.py`, excerpt):
```python
FRAMEWORKS = {
    "fastapi", "litestar", "blacksheep", "starlette", "msgspec", "mcp",
    "langchain", "langchain_core", "langchain_openai", "langgraph",
    "pymongo", "pydantic", "httpx", "httpx2",
}
```
The test walks every `.py` file with `ast`, collects `import`/`from` modules, and fails on any of these in the protected layers.

**Common mistake** — "just one import" in the domain to save time: the next one is easier, and layers erode silently.

### Do ✋
1. Add `import langgraph` at the top of `src/agent_runtime/domain/workflow/conditions.py`.
2. `uv run pytest tests/architecture -q` → fails, naming the file and import.
3. Undo: `git restore src/agent_runtime/domain/workflow/conditions.py`.

**Milestone:** you can explain why our services are hexagonal, show each ring, and prove a boundary is enforced.
