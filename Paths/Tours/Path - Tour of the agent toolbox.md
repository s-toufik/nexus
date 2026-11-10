---
type: path
track: Tours
time: ~3 h
projects: ["[[Agent toolbox]]"]
tags: [path, tour]
updated: 2026-11-10
---

# Path - Tour of the agent toolbox

> **Goal:** know the toolbox end to end — every tool, how they're published and called, the sandbox, the tools it borrows from other servers, and the fence around it — and the principles behind it.
> **Time:** ~3 h. **Before:** [[Path - Tour of the agent runtime]]. **Then:** [[Path - Tour of pycraftcore]] · [[Path - Tools and safety]]. **All paths:** [[Paths]]

## 1. What it is, and why · ~45 min
**Read:** [[Agent toolbox]] and its canvas.

**Do:** 👀 homelab-ui's **Tools** page: run `file_reader` on a file the agent wrote, then a `postgres_*` tool. Open the same tools in the MCP Inspector (`:6274`).

**Check:**
1. Why is the toolbox a separate service rather than code inside the agent?
> [!success]- Answer
> Tools change independently (the agent discovers them at start), any MCP client can use them, and the risky part — running model-written code and touching data — lives in one fenced pod with its own limits.

## 2. How it's built · ~1 h
**Read:** [[Agent toolbox layers]] · [[agent-toolbox]]

**Do:** 👀 `src/agent_toolbox/application/` (the use case and `Tool` port), `adapter/inbound/mcp/` (`ToolBinder`), `adapter/inbound/sandbox/` (`SandboxToolBridge`), `adapter/outbound/` (the tools).

**Check:**
1. A new tool is added. What does it take for the agent and the UI to show it?
> [!success]- Answer
> Register it in `ToolboxDI` and release; then restart the agent (it lists tools at boot). The UI's Tools page lists whatever the toolbox publishes, with no change.

## 3. The sandbox and borrowed tools · ~1 h
**Read:** [[Agent toolbox sandbox]] · [[Agent toolbox republished tools]]

**Check:**
1. Name three limits on code run by `python_executor`.
> [!success]- Answer
> Its own process with 256 MB and a timeout; imports limited to an allowlist (no `os`, `subprocess`, `socket`); files only in the working directory. (Plus at most 8 runs at once, and tool calls only through the bridge.)

## 4. The principles inside
| Principle | Concept | Where it lives here | Go deep |
|---|---|---|---|
| One use case, two inbound adapters | [[Hexagonal architecture]] | `InvokeToolUseCase`, `ToolBinder`, `SandboxToolBridge` | [[Path - Design that lasts]] |
| Schemas from typed models | [[Data validation with pydantic and msgspec]] | `adapter/outbound/<area>/model/` | [[Path - Python for services]] |
| Tools over a protocol, host checks | [[Model Context Protocol]] | `/mcp`, allowed hosts | [[Path - Tools and safety]] |
| Sandboxing untrusted code | [[AI agents and sandboxing]] | pycraftcore runtime | [[Path - Tools and safety]] |
| Network fence | [[NetworkPolicy]] | homelab's `apps/agent-toolbox/values.yaml.gotmpl` | [[Path - Tools and safety]] |
| Read-only by default | [[Least privilege and defence in depth]] | `users_tables` (sqlglot), read-only MCP accounts | [[Path - Security and failure]] |
| Contract tests | [[Unit tests and test doubles]] | `tests/contract/test_tool_parity.py` | [[Path - Design that lasts]] |

**Milestone:** you can add a tool and explain every limit around it.
