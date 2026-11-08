---
type: architecture
project: "[[Agent toolbox]]"
order: 1
tags: [agent-toolbox, architecture]
updated: 2026-11-08
---

# Agent toolbox layers

> Every tool is a plain class, `Tool[Input, Output]`, with pydantic models for its arguments and result. **`InvokeToolUseCase`** validates, logs, runs and maps failures. Two inbound adapters call that one use case: **`ToolBinder`** publishes each tool over MCP; **`SandboxToolBridge`** lets sandboxed code call the same tools. So a tool never knows MCP exists.

Back: [[Agent toolbox]] · Next: [[Agent toolbox sandbox]]

**Do it:** [[Agent toolbox - Add a tool]]

## The shape
```text
  MCP request ──► ToolBinder ─────────► InvokeToolUseCase ──► Tool.run ──► a data tool ──► its backend
  (inbound)       one MCP tool per Tool  validate, log, map    │
                  schema from the models  failures             └─► ExecutePython ──► PythonSandbox (pycraftcore)
  sandboxed code ─► SandboxToolBridge ──► InvokeToolUseCase
                    same use case, same tools, same request id
```
| Layer | Holds |
|---|---|
| `domain/` | `WorkingDirectory`, `SandboxRun`, `ToolFailure`, `UnknownToolException` |
| `application/` | `InvokeToolUseCase`; ports `Tool`, `CodeSandboxPort` |
| `adapter/inbound/mcp/` | `ToolBinder`, the ASGI app, allowed hosts, actuator |
| `adapter/inbound/sandbox/` | `SandboxToolBridge` |
| `adapter/outbound/` | The tools by area (`sql/`, `file/`, `code/`), `mcp/` (other servers' tools), `sandbox/` |
| `bootstrap/` | Settings, `ToolboxDI` (wiring), the app |

## Schemas come from the models
A tool's `input_model` / `output_model` are pydantic; field descriptions become the JSON schema in `tools/list`, which is what the model reads to choose and fill a tool ([[Data validation with pydantic and msgspec]]). Bad arguments get an error naming the bad fields — the model can fix its call.

## Same use case, two doors
Direct calls and calls from sandboxed code go through the same `InvokeToolUseCase`, so they return the same thing; `tests/contract/test_tool_parity.py` proves it. The request id (`X-Request-ID`) follows sandboxed calls too, so logs of one conversation line up.

## Boundaries
`tests/architecture/test_boundaries.py`: no agent, LangChain or LangGraph imports; no framework in the domain; no transport in the application ([[Architecture tests]]).

## Edge cases
- **Allowed hosts:** only requests whose `Host` matches `TOOLBOX_URL` (or `TOOLBOX_EXTRA_ALLOWED_HOSTS`) are accepted → `421 Invalid Host header` otherwise ([[Model Context Protocol]]).
- **Readiness:** 503 until tools are registered.

## Check yourself
1. What changes in a tool when it becomes callable from the sandbox?
2. Why do tool field descriptions matter as much as code?

## Go further
- [MCP: tools](https://modelcontextprotocol.io/docs/concepts/tools).
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk).
