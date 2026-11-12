---
type: concept
domain: Kubernetes
level: intermediate
tags: [concept, kubernetes, resilience]
updated: 2026-11-12
---

# Start order and dependencies

> Kubernetes has no `depends_on`: any pod can start, restart or move at any time, in any order. So a service doesn't wait for what it needs: it starts, notices what is missing, and **keeps trying until it's there** (it *reconciles*), the way Kubernetes' own controllers do.

## Why it matters
Start order is a promise you can't keep. A first install can be ordered, but a server reboot starts every pod at once, an upgrade restarts one alone, and a crash restarts one alone at 3 a.m. Code that reads its dependencies once at start works on your laptop and breaks after the first reboot.

## How it works
| Layer | Tool | Covers |
|---|---|---|
| Deploy order | helmfile `needs:`, Helm hooks, Argo CD sync waves | The first `apply` only |
| Start | an initContainer `wait-for`, or crashing until the dependency answers (CrashLoopBackOff) | The first start only, and slowly (the back-off grows to 5 min) |
| **Run** | **a reconcile loop in the app**: retry with back-off while missing, re-check slowly once there | Every case: first start, reboot, restart of either side, a dependency that changes |
| Report | health that *lists* dependencies; [[Probes|readiness]] about the app itself | Seeing it, without cascading failures |

- **Back-off**: retry soon (5 s), then double (10, 20, 40), up to a ceiling (60 s): fast recovery without hammering a server that's down ([[Retry and backoff]]).
- **One loop per dependency**: each one keeps its own count of failures and its own pace, so a server that is down never makes the others be re-read every 5 s.
- **Keep, don't hide**: when a known dependency disappears, keep what you learned from it and fail calls with a clear message, rather than changing what you offer mid-flight.
- **Hard vs optional dependency**: an API that is useless without its database may report not-ready when it's gone. A dependency that only *adds* something (extra tools) must never make the service not ready: one missing piece would take everything down.

## In our projects
- **agent-toolbox ⟳ grafana-mcp, mongodb-mcp, postgres-mcp** — `ReconcileExternalTools` (`application/use_case/reconcile_external_tools.py`) re-lists each server's tools, diffs them against the live `ToolCatalog`, and `McpToolPublisher` adds or removes them on the running MCP server (`add_tool` / `remove_tool`), republishing `python_executor` whose description lists the functions it can call. `/actuator/health` shows each server.
- **agent-runtime ⟳ agent-toolbox** — `ToolCatalogRefresher` (`application/tool/`) does the same for the agent's `ToolRegistry`; the plan and act steps read the catalogue each turn, so new tools are used at the next message. A model asking for an unknown tool wakes it at once.
- **Where the pieces sit**: the numbers are configuration, the `refresh` block of each MCP connector in pycraftcore ([[pycraftcore configuration]]); the back-off rule is domain, `RefreshPolicy.delay_after(failures)` in both services; the loop is a use case in the application layer ([[Hexagonal architecture]]).
- helmfile `needs:` stays, for a tidy first install ([[helmfile]], [[Homelab deployment]]).

## Pitfalls we met
- **"Skipped, will appear at next start"** — the old behaviour: tools read once at boot. After a reboot the toolbox could start before grafana-mcp, and the agent before the toolbox, and stay without those tools until someone restarted them.
- **A cancellation that escaped**: when the toolbox was unreachable, the MCP client's task group cancelled the *caller's* task; `except Exception` doesn't catch `CancelledError`, so the agent's boot crashed instead of skipping the toolbox. Closing the failed attempt's context turns it back into the real error (`StreamableHttpSessionFactory._close_failed_attempt`). Any retry loop around [[asyncio]] task groups must handle this.
- An in-memory test client and a real HTTP one don't behave alike: the bug only showed against a closed port.

## Check yourself
1. helmfile already orders agent-toolbox after the MCP servers. Why isn't that enough?
> [!success]- Answer
> `needs:` orders `make apply` only. After a reboot or a restart, pods start in any order, and nothing re-runs that ordering.
2. grafana-mcp is down. Should the toolbox's readiness probe fail? Why?
> [!success]- Answer
> No: the toolbox would be removed from its Service and the agent would lose every tool — files and Python included — for a server that only adds some. Report it in health instead.
3. Why retry after 5 s, then 10, 20, 40, 60 — and not every second?
> [!success]- Answer
> A server that just restarted usually answers within seconds, so try soon; one that stays down shouldn't be hit every second by every client. Doubling to a ceiling balances the two.
4. The toolbox once had one loop for all its MCP servers. What went wrong when only grafana-mcp was down?
> [!success]- Answer
> The shared failure count made every pass a retry, so mongodb-mcp and postgres-mcp were re-read on grafana's back-off (5, 10, 20 s…) instead of once a minute. One loop each keeps each server's pace its own.

## Go further
- [Kubernetes: controllers and the reconcile loop](https://kubernetes.io/docs/concepts/architecture/controller/).
- [The Twelve-Factor App: backing services](https://12factor.net/backing-services) and [disposability](https://12factor.net/disposability).
- [Google SRE book: handling overload, retries and back-off](https://sre.google/sre-book/handling-overload/).
