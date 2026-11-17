---
type: log
date: 2026-11-17
projects: ["[[Homelab UI]]", "[[Agent runtime]]"]
tags: [log, agents, observability]
---

# 2026-11-17 Agents map exact lines

## What we did
- **agent-runtime**: `DelegateTasksTool` counts each task it is waiting on in an OpenTelemetry up-down counter `agent.delegations.active` (attribute `peer`), through a `DelegationMeter` port and an `OtelDelegationMeter` adapter. Prometheus gets `agent_delegations_active{job="agent-supervisor", peer="observation"}`.
- Found that no metric left agent-runtime at all: pycraftcore registers its tracer provider globally but not its meter provider, so the FastAPI instrumentation recorded into nothing (the Agents map's "who is busy" never had server data). `register_meters` now sets the global meter provider from the telemetry provider at boot (`ProviderMeters`).
- Helm values: `OTEL_METRIC_EXPORT_INTERVAL=5000` (default is 60 s).
- **homelab-ui**: the Agents map draws a line only for a real delegation: from the metric (`sum by (job, service_name, peer) (agent_delegations_active)`) or from the answer streaming in this browser (its `agent` progress). The guess "supervisor and agent busy at once" is gone; a delegated agent shows working.
- Checks: agent-runtime 618 tests, ruff, ty; homelab-ui 190 tests, build.

## What I learned
- OpenTelemetry instrumentation libraries record into the global provider unless given one; a library that only sets the tracer provider leaves metrics silently unexported.
- An up-down counter per `peer` is the simplest "who is waiting on whom" signal: it reaches 0 when the call ends, also when it fails (decrement in `finally`).

## Next
- [ ] Commit, release and deploy agent-runtime and homelab-ui; then check in Prometheus that `http_server_active_requests` and `agent_delegations_active` arrive.
