---
type: repository
project: "[[Agent runtime]]"
repo: https://github.com/s-toufik/agent-runtime
language: Python 3.14
status: active
tags: [repository, agent-runtime]
updated: 2026-11-08
---

# agent-runtime

> The agent service: a FastAPI API over a hexagonal core, LangGraph and LangChain behind ports, plus its own evaluation program.

## Layout
| Path | What it holds |
|---|---|
| `src/agent_runtime/domain/` | `Conversation`, `Turn`, value objects, `TurnPolicy` |
| `src/agent_runtime/application/` | `HandleMessage`, step handlers `*_step.py`, ports |
| `src/agent_runtime/adapter/inbound/web/` | `StreamAgentController`, `SsePresenter` |
| `src/agent_runtime/domain/a2a/` | `TaskState`, `TaskUpdate`, `A2aTaskRequest`, `AgentProfile` (no SDK) |
| `src/agent_runtime/adapter/inbound/a2a/` | `A2aAgentExecutor` (the a2a-sdk's `AgentExecutor`), `A2aTaskPresenter`, `agent_card` |
| `src/agent_runtime/adapter/inbound/exception/`, `turn_status.py` | Shared by the inbound adapters: `ServerAtCapacityException`, step labels |
| `src/agent_runtime/adapter/outbound/llm/` | LangChain adapters per role, prompts, `ModelCatalog` |
| `src/agent_runtime/adapter/outbound/tool/` | MCP discovery and calls (`Toolbox`) |
| `src/agent_runtime/adapter/outbound/langgraph/` | Graph nodes, edges from `TurnPolicy`, state codec, checkpointer |
| `src/bootstrap/` | Settings, `AgentDI`, container, `create_agent_application`, the FastAPI API (`router/`, `schema/` in pydantic) |
| `src/agent_evaluation/` | The evaluation program |
| `config/` | `root.yml`, `<env>/connector/`, `operation/`, `server/` |
| `tests/` | Unit, scenario (two runners), architecture, evaluation tests |
| `devops/docker/Dockerfile`, `devops/helm/values.yml` | Image (Granian on 8000) and how it runs on the homelab |

## How it runs
`make run` locally (Granian), `make docker_build` for the image; on the homelab a Helm release — [[Agent runtime - Release a version]].

## Make targets
`venv install install_dev update_dependency test evaluate lint fix format typecheck check run clean build docker_build`

## Knowledge it uses
[[Hexagonal architecture]] · [[LangGraph]] · [[pycraftcore]] · [[Server-sent events]] · [[uv and pyproject]]
