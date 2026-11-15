---
type: guide
project: "[[Agent runtime]]"
tags: [guide, agent-runtime]
updated: 2026-11-15
---

# Agent runtime - Add an agent

> Create a new agent from a folder, try it locally, and let the supervisor call it.

**Where:** on your Mac, in `agent-runtime` · **All guides:** [[Agent runtime guides]]

## 1. The folder
1. Create `agents/<name>/agent.yml` (copy `agents/observation/agent.yml`), and set:
   - `name: <name>` (the folder's name), `description` (it's also `{identity}` in prompts), `skills`;
   - `tool_scope`: a scope the toolbox serves, `all`, or `none` ([[Agent toolbox - Add or change a scope]]);
   - `turns`: among `direct`, `clarify`, `plan`, `review` (at least `direct` or `plan`).
2. Optional: `agents/<name>/prompts/<step>.md` for a step whose generic prompt doesn't fit (`understand`, `plan`, `act`, `review`, `screen`, `summarize`). Keep the step's required placeholders: `{output_format}`, `{tools}` in plan, `{mode}` in act.
3. Check: `make test` — raw: `uv run pytest -q`. `test_every_agent_folder_loads_and_its_prompts_fit_their_steps[<name>]` passes.

## 2. Let the supervisor call it
1. In `config/debug/connector/a2a.yml`, add a connector `agent_<name>` with `base_url: ${oc.env:AGENT_<NAME>_URL,""}`, and list it under `a2a:` in `config/root.yml`.
2. Add `<name>` to `peers` in `agents/supervisor/agent.yml`.
3. Check: `make check` — raw: `uv run ruff check src tests && uv run ty check && uv run pytest -q`.

## 3. Try it locally
1. Start it on its own port:
   - `AGENT=<name> make run` — raw: `AGENT=<name> uv run granian --interface asgi --factory --port 8001 bootstrap.application.agent_application:create_agent_application`
2. Check: `curl http://localhost:8001/.well-known/agent-card.json` → `"name": "<name>"` and its skills.
3. Start the supervisor with `AGENT_<NAME>_URL=http://localhost:8001` on another port, then `curl http://localhost:<port>/v1/agents` → your agent is listed.

## 4. Ship it
1. Release agent-runtime: [[Agent runtime - Release a version]].
2. On the homelab: a release `agent-<name>`, its URL for the supervisor and its gateway route ([[Homelab - Run the LLM and agent]], *Add an agent*).

## Why it works
- [[Agent runtime agents]] — what each field changes, prompts, turns, peers.
- [[Agent runtime turn]] — the routes a shape keeps.
