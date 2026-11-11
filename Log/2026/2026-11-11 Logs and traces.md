---
type: log
date: 2026-11-11
projects: ["[[Homelab]]", "[[Homelab UI]]", "[[Agent runtime]]", "[[Agent toolbox]]"]
tags: [log, observability]
---

# 2026-11-11 Logs and traces

## What we did
- **Log levels in one case.** Loki copied OTLP's `severity_text` (`INFO`) as the level; `log_level_fields` in Loki's config now leaves it out, so OTLP lines get their level from the severity number (`info`). The Logs page also merges cases for older lines → [[Homelab UI page - Logs]].
- **Less noise.** oauth2-proxy no longer logs Caddy's session check on every request (`--exclude-logging-path=/oauth2/auth`) nor health checks; kafka-ui writes plain lines instead of colour codes.
- **Logs → traces.** A log line with a `trace_id` has *Open its trace →*; `/traces?trace=<id>` opens a trace.
- **One trace per agent message.** agent-runtime gets a server span per request (Litestar's OpenTelemetry plugin) and a span per step (`AgentNode`); tool calls join through the MCP SDK's `_meta.traceparent`. The toolbox no longer makes a trace per `notifications/initialized` → [[Homelab UI page - Traces]].
- Tests: homelab-ui 114 (2 new specs), agent-runtime 433 (5 new: spans nest, a caller's `traceparent` is continued, health checks untraced, a tool call joins the step's trace), agent-toolbox 135 (3 new).

## What I learned
- The MCP Python SDK (2.3) already propagates trace context, in the request's `_meta`, and opens a server span per message. The missing piece was ours: no span open in the agent.
- The single `http.request` span of each "agent trace" was the call *to the model*, from pycraftcore's resilient client — not the request the agent received.
- An in-memory MCP client doesn't send `notifications/initialized`; the HTTP one does. A test has to fail without the fix to prove anything.

## Next
- [ ] Release agent-runtime and agent-toolbox, bump them in homelab-infra's `versions.yaml`, deploy Loki, oauth2-proxy and kafka-ui.
- [ ] Ask for something needing a tool; check the trace shows the steps and the toolbox's span.
- [ ] pycraftcore's `http.request` span: add the method, URL and status, so a model call reads as one.
