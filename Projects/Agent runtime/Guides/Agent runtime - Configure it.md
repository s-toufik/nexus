---
type: guide
project: "[[Agent runtime]]"
tags: [guide, agent-runtime]
updated: 2026-11-13
---

# Agent runtime - Configure it

> Environment variables, configuration files, the models users can pick, the model each step uses, and more MCP servers.

**Where:** on your Mac (`.env`, `config/`), or the deployment's values · **All guides:** [[Agent runtime guides]]

**Environment variables.** `.env.example` is the reference; the main ones:

| Variable | Default | Meaning |
|---|---|---|
| `APP_ENV` | `debug` | Which `config/<APP_ENV>/` folder is read |
| `CONFIGURATION_DIR` | `./config` | Where `config/` is |
| `LOG_LEVEL` | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR` or `CRITICAL` |
| `DEPLOYMENT_ENVIRONMENT` | `unknown` | Label shown by `/actuator/info` and on telemetry |
| `GUARDRAIL_ENABLED` | `false` | `true` checks every plan before it runs and refuses unsafe ones |
| `MAX_CONCURRENT_STREAMS` | `200` | Open streams accepted at once; above it the API answers `503` |
| `WEB_BASE_PATH` | empty | A prefix for every route, e.g. `/agent-runtime` → `/agent-runtime/v1/stream`. Use it when the gateway keeps the prefix. Starts with `/`, no trailing `/` |
| `WEB_DOCS` | `false` | `true` serves the API documentation at `<base path>/docs` |
| `AGENT_ANSWER_DELIVERY` | `stream` | `stream`: answers that need no review arrive as `token` events, then `final`. `whole`: only `final` |
| `A2A_MODEL` | empty | The model A2A tasks use when the message names none; empty: the first listed model |
| `A2A_URL` | empty | The A2A endpoint the agent card announces, e.g. behind a gateway; empty: the address the card was read from, plus `/a2a` |
| `HOMELAB_LLM_BASE_URL`, `HOMELAB_LLM_API_KEY` | one provider required | The homelab's model server, e.g. `http://<llm-server>:<port>/v1`, and its key (empty for a local server) |
| `NVIDIA_LLM_BASE_URL`, `NVIDIA_LLM_API_KEY` | one provider required | NVIDIA's API, `https://integrate.api.nvidia.com/v1`, and its `nvapi-…` key |
| `TOOLBOX_URL` | required | The MCP server, e.g. `http://<toolbox-host>:<port>/mcp` |
| `DB_MONGO_CHECKPOINT_HOST` / `_PORT` / `_NAME` / `_USERNAME` / `_PASSWORD` | required | Conversation storage in MongoDB |
| `DB_SQLITE_CHECKPOINT_HOST` / `_NAME` | required | SQLite fallback (folder and file name) |
| `OTEL_HOST`, `OTEL_PORT` | required | OpenTelemetry collector (gRPC); an empty host turns telemetry off |

"Required" variables must exist; an empty value is fine when the feature is unused.

`LOG_LEVEL`, `WEB_BASE_PATH`, `WEB_DOCS`, `MAX_CONCURRENT_STREAMS`, `AGENT_ANSWER_DELIVERY`, `A2A_MODEL` and `A2A_URL` have their defaults in the YAML (`root.yml`, `server/asgi.yml`). In a deployment, never pass one empty (e.g. Compose's `${WEB_DOCS}` with nothing set): an empty variable overrides the YAML default, and the agent refuses to start.

**Configuration files.** `config/root.yml` lists what exists; `config/<APP_ENV>/` defines it:

| File | What you set there |
|---|---|
| `connector/api.yml` | The model server; `timeout` (seconds one model call may wait) and `retry` (retries after a 5xx, a 429 or a connection failure; a silent model is not retried) |
| `connector/mcp.yml` | The MCP servers |
| `connector/database.yml` | MongoDB, SQLite, and how long conversations are kept |
| `connector/telemetry.yml` | The OpenTelemetry collector |
| `operation/llm.yml` | The models users can pick, and their parameters |
| `operation/agent.yml` | Which model each step uses |
| `server/asgi.yml` | How the API is served: `base_path`, `docs`, `cors_origins`, and `parameters` (`max_concurrent_streams`, `answer_delivery`) |

**Models** (`operation/llm.yml`), one entry per model:

| Parameter                | Meaning                                                                                                  | Default            |
|--------------------------|----------------------------------------------------------------------------------------------------------|--------------------|
| `model`                  | The name the model server knows, and the `model_name` requests use                                       | the entry's `name` |
| `temperature`            | Sampling temperature                                                                                     | `0.0`              |
| `max_output_tokens`      | Longest reply                                                                                            | `8000`             |
| `max_context_tokens`     | The model's context window; never more than the server's own (`--ctx-size` for llama.cpp)                | `8000`             |
| `max_iterations`         | Step budget per message                                                                                  | `10`               |
| `max_reflection_retries` | How many times a rejected answer is rewritten                                                            | `2`                |
| `reasoning_effort`       | `null`: no thinking. `low` / `medium` / `high`: think first (slower, needs a larger `max_output_tokens`) | `null`             |

To add a model: add its entry, list it under `operation:` in `config/root.yml`, and restart. An entry's key cannot contain a dot: write `qwen3_5-2b` as the key and `model: qwen3.5-2b` in its parameters.

**Model per step** (`operation/agent.yml`): each step that calls a model has an entry named after its role. Today: `agent_context` (understand), `agent_plan`, `agent_act`, `agent_reflection` (review), `agent_guard` (screen) and `agent_summary`.

- `parameters.model: null`: the step uses the model named in the request.
- `parameters.model: <name>`: the step always uses that model. When `agent_act` is fixed, its entry also sets the step budget (`max_iterations`, `max_reflection_retries`, `max_context_tokens`).

**More MCP servers:** add a connector whose name starts with `external_mcp_` in `connector/mcp.yml`, list it under `mcp:` in `config/root.yml`, and restart. Its tools join the same catalogue:

```yaml
connector:
  external_mcp_analytics:
    name: external_mcp_analytics
    type: mcp
    base_url: https://<analytics-host>/mcp
    timeout: 30
    transport: streamable_http
    auth:
      type: token
      key_name: Authorization
      key_value: ${oc.env:ANALYTICS_MCP_TOKEN,''}
```

## Why it works
- [[pycraftcore configuration]] — connectors, operations, servers, `${oc.env:…}`.
- [[Agent runtime turn]] — the steps a model per step refers to.
