---
type: architecture
project: "[[pycraftcore]]"
order: 5
tags: [pycraftcore, architecture, security]
updated: 2026-11-08
---

# pycraftcore runtime sandbox

> `PythonSafeCode` writes a runner script from a template, starts it as a **separate Python process**, and reads its stdout. The runner limits memory and CPU, swaps `__import__` for an allowlist, swaps `open` for one confined to the working directory, and optionally exposes your functions through an **authenticated loopback socket** to a `HostBridgeServer` in the parent.

Previous: [[pycraftcore resilience]] · Back: [[pycraftcore]]

**Do it:** [[pycraftcore - Run untrusted Python]]

## Inside the runner
| Guard | How |
|---|---|
| Memory, CPU | `resource.setrlimit(RLIMIT_AS, max_memory_mb)` and `RLIMIT_CPU` 10 s (Linux), plus the parent's wall-clock timeout |
| Imports | `builtins.__import__` replaced: the root module must be in `PYTHON_ALLOWLIST` (pandas, numpy, matplotlib, datetime…) |
| Files | `builtins.open` replaced: paths resolved with `realpath` and must stay under the working directory (no `../` or symlink escape); no working directory → no file access |
| Recursion | `sys.setrecursionlimit(500)` |
| Result | the variable `result` printed as JSON on stdout; tracebacks trimmed to the code's own lines |

## The host bridge
```text
service process                                sandbox process
HostBridgeServer on 127.0.0.1:<random port> ◄── socket, one JSON line per call ── users_tables(query=…)
  token (secrets.token_hex), function names,      the proxy sends {token, function, arguments},
  max_calls 200, call_timeout 30 s                 gets the result or raises ToolError
```
The port is random and loopback-only; the token is a fresh secret per server; a call quota stops runaway loops. The parent decides which functions exist — in the toolbox, its tools ([[Agent toolbox sandbox]]).

## Honest limits
Replacing `__import__` and `open` inside Python is **not** a hard security boundary: Python's introspection offers ways around it. The process isolation, resource limits and — on the homelab — the pod's hardening and NetworkPolicy are what make it acceptable ([[Least privilege and defence in depth]]). For hostile multi-tenant code you'd want a container or VM per run (gVisor, Firecracker).

## Check yourself
1. Why `realpath` before checking the working directory?
> [!success]- Answer
> `realpath` resolves `..`, `.` and symlinks to the real path first. Checking the raw string, `work/../../etc/passwd` or a symlink inside the working directory pointing outside would look as if it stayed under it.
2. Why a token on a loopback-only socket?
> [!success]- Answer
> Any process on the machine can connect to a loopback port, including other code in the same pod. The token, a fresh secret per server known only to the sandbox it started, makes the bridge refuse calls from anything else.

## Go further
- [Python `resource` module](https://docs.python.org/3/library/resource.html).
- [gVisor](https://gvisor.dev/docs/) — a real sandbox for containers.
