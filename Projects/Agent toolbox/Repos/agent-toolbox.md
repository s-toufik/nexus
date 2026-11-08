---
type: repository
project: "[[Agent toolbox]]"
repo: https://github.com/s-toufik/agent-toolbox
language: Python 3.14
status: active
tags: [repository, agent-toolbox]
updated: 2026-11-08
---

# agent-toolbox

> The MCP tool server: tools as plain classes, MCP and the sandbox as two inbound adapters, other MCP servers republished.

## Layout
| Path | What it holds |
|---|---|
| `src/agent_toolbox/domain/` | `WorkingDirectory`, `SandboxRun`, `ToolFailure` |
| `src/agent_toolbox/application/` | `InvokeToolUseCase`, ports `Tool`, `CodeSandboxPort` |
| `src/agent_toolbox/adapter/inbound/mcp/`, `sandbox/` | `ToolBinder`, ASGI app, allowed hosts, actuator; `SandboxToolBridge` |
| `src/agent_toolbox/adapter/outbound/` | `sql/`, `file/`, `code/`, `mcp/` (republished), `sandbox/` |
| `src/bootstrap/` | Settings, `ToolboxDI`, the application |
| `config/` | `root.yml`, `debug/connector/`, `debug/operation/` (copied to `deploy` in the image) |
| `tests/` | Unit, architecture, contract (tool parity) |
| `devops/` | Dockerfile (Granian on 8001), `helm/values.yml` |

## Make targets
`venv install install_dev update_dependency test lint fix format typecheck check run clean build docker_build`

## Knowledge it uses
[[Model Context Protocol]] · [[pycraftcore]] · [[Hexagonal architecture]] · [[uv and pyproject]]
