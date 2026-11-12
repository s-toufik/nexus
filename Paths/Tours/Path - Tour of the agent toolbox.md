---
type: path
track: Tours
time: ~4 h
projects: ["[[Agent toolbox]]"]
tags: [path, tour]
updated: 2026-11-10
---

# Path - Tour of the agent toolbox

> **Goal:** know the toolbox end to end — every tool, how tools are published and called, the sandbox, the tools it borrows from other servers, and the fence around it — and the principles behind it.
> **Time:** ~4 h. **Before:** [[Path - Tour of the agent runtime]]. **Then:** [[Path - Tour of pycraftcore]] · [[Path - Tools and safety]]. **All paths:** [[Paths]]

How each lesson works: **Learn** → **Do** (👀 looks, ✋ changes) → **Check** → **You can now**.

## 1. What it is, and why · ~45 min

### Learn
**Definitions**
- **MCP server** — a service that publishes tools (name, description, JSON schema) and runs them on request, over the Model Context Protocol ([[Model Context Protocol]]).
- **Tool** — one capability: `users_tables` (read-only SQL), `file_reader`, `file_writer`, `python_executor`, and the republished `grafana_*`, `mongodb_*`, `postgres_*`.
- **Working directory** — the one folder file tools and the sandbox may touch.
- **Sandbox** — where `python_executor` runs model-written code with limits.

**How it works**
```text
agent / MCP client ──► /mcp ──► ToolBinder ──► InvokeToolUseCase ──► Tool.run ──► backend (DB, files, MCP server…)
sandboxed code ──────────────► SandboxToolBridge ─┘ (same use case, same tools, same request id)
```

**Example from our projects** — code the model can send to `python_executor`, calling other tools as functions:
```python
import pandas as pd
rows = users_tables(query="SELECT country, COUNT(*) AS users FROM users GROUP BY country")
df = pd.DataFrame(rows["rows"])
file_writer(file_path="users_by_country.csv", data=df.to_csv(index=False))
result = df.sort_values("users", ascending=False).head(3).to_dict("records")
```
One call does a query, an analysis and a file — and the rows never pass through the model's context.

**Common mistake** — expecting a new tool to appear in the agent at once: the agent re-reads the toolbox every 60 s, so allow up to a minute (or ask for the tool: an unknown name makes it re-read at once). The same holds between the toolbox and the MCP servers it republishes ([[Start order and dependencies]]).

### Do
👀 homelab-ui's **Tools** page: run `file_reader` on a file the agent wrote, then `postgres_list_schemas`. Open the same in the MCP Inspector (`https://<HOMELAB_DOMAIN>:6274`).

### Check
1. Why is the toolbox a separate service rather than code inside the agent?
> [!success]- Answer
> Tools change independently (the agent discovers them at start), any MCP client can use them, and the risky part — running model-written code and touching data — lives in one fenced pod with its own limits.

**You can now:** list the tools and say what each can reach.

## 2. How a tool is built · ~1 h

### Learn
**Definitions**
- **Abstract base class (ABC)** — a class others must extend, with abstract methods they must implement. The toolbox's `Tool` port is one (nominal typing), unlike agent-runtime's `Protocol` ports (structural typing).
- **pydantic model** — a typed class that validates data and generates a JSON schema ([[Data validation with pydantic and msgspec]]).
- **Use case** — the application operation: here `InvokeToolUseCase`.

**How it works**
A tool declares `name`, `description`, `input_model`, `output_model` and `run`. `InvokeToolUseCase.invoke` finds the tool, drops `None` arguments, validates them against `input_model` (bad fields → a `ToolFailure` naming them), runs it, logs, and returns `model_dump(mode="json")`.

**Example from our projects** — the port (`application/port/outbound/tool_port.py`):
```python
class Tool[I: BaseModel, O: BaseModel](ABC):
    name: str
    description: str
    input_model: type[I]
    output_model: type[O]

    @abstractmethod
    async def run(self, arguments: I) -> O: ...
```
`file_reader`'s input (`adapter/outbound/file/model/file_read_input.py`):
```python
class ReadFileInput(BaseModel):
    file_path: str = Field(
        description="File path, including extension. When a working directory is configured, relative paths resolve inside it and paths outside it are refused."
    )
    start: int | None = Field(default=None, description="Line number to start reading from (0-based). Giving start or count reads raw lines.")
    count: int | None = Field(default=None, description="Maximum number of lines to read.")
```
Those descriptions are what the model reads in `tools/list` to fill the call.

**Common mistake** — vague descriptions. The model can't see your code; a tool described as "reads files" gets called with absolute paths, wrong formats, missing arguments.

### Do
👀 `src/agent_toolbox/application/use_case/invoke_tool_usecase.py` and `adapter/outbound/file/reader_tool.py`.

### Check
1. A new tool is added. What does it take for the agent and the UI to show it?
> [!success]- Answer
> Add it to the catalogue in `ToolboxDI` and release. The agent picks it up within a minute, with no restart (it re-reads the toolbox in the background). homelab-ui's Tools page lists whatever the toolbox publishes, with no change.

**You can now:** read and write a tool. Deep dive: [[Agent toolbox layers]].

## 3. The sandbox and borrowed tools · ~1.5 h

### Learn
**Definitions**
- **Process isolation** — code runs in a separate OS process: a crash or loop can't take the server down.
- **Allowlist** — the only modules sandboxed code may import (pandas, numpy, matplotlib, datetime, math, json, csv, re… — no `os`, `subprocess`, `socket`).
- **Host bridge** — a loopback socket with a per-run token through which sandboxed code calls the toolbox's tools.
- **Republished tool** — another MCP server's tool, published under a prefix (`list-databases` → `mongodb_list_databases`).

**How it works**
`python_executor` → pycraftcore's `PythonSafeCode` writes a runner script, starts a Python process with memory and CPU limits, an import allowlist and `open` confined to the working directory; tool functions inside it are proxies to `HostBridgeServer`. Separately, at start-up, each `external_mcp_*` connector's tools become `McpBackedTool`s under their prefix.

**Example from our projects** — the import guard inside the runner (pycraftcore `python_runner_template.py`):
```python
def _safe_import(name, globals=None, locals=None, fromlist=(), level=0):
    root = name.split(".", 1)[0]
    if root not in _ALLOWED_IMPORTS:
        raise ImportError(f"Import '{root}' is not allowed.")
    return _real_import(name, globals, locals, fromlist, level)
```

**Common mistake** — believing this guard alone makes code safe. Python can be introspected around such guards; the real safety is the layers together: process, limits, tools only through validation, and the pod's NetworkPolicy and hardening ([[Agent toolbox sandbox]]).

### Check
1. Name four limits on code run by `python_executor`.
> [!success]- Answer
> Its own process with 256 MB and a timeout; imports limited to an allowlist; files only in the working directory; at most 8 runs at once; other tools only through the bridge.

**You can now:** explain what model-written code can and can't do. Deep dive: [[Agent toolbox republished tools]].

## 4. The principles inside · ~30 min
| Principle | Concept | Where it lives here | Go deep |
|---|---|---|---|
| One use case, two inbound adapters | [[Hexagonal architecture]] | `InvokeToolUseCase`, `ToolBinder`, `SandboxToolBridge` | [[Path - Design that lasts]] |
| Schemas from typed models | [[Data validation with pydantic and msgspec]] | `adapter/outbound/<area>/model/` | [[Path - Python for services]] |
| Tools over a protocol, host checks | [[Model Context Protocol]] | `/mcp`, allowed hosts | [[Path - Tools and safety]] |
| Sandboxing untrusted code | [[AI agents and sandboxing]] | pycraftcore `runtime` | [[Path - Tools and safety]] |
| Network fence | [[NetworkPolicy]] | homelab's `apps/agent-toolbox/values.yaml.gotmpl` | [[Path - Tools and safety]] |
| Read-only by default | [[Least privilege and defence in depth]] | `users_tables` (sqlglot check), read-only MCP accounts | [[Path - Security and failure]] |
| Contract tests | [[Unit tests and test doubles]] | `tests/contract/test_tool_parity.py` | [[Path - Design that lasts]] |

**Milestone:** you can add a tool and explain every limit around it.
