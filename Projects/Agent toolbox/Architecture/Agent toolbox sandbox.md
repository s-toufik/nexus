---
type: architecture
project: "[[Agent toolbox]]"
order: 2
tags: [agent-toolbox, architecture, security]
updated: 2026-11-08
---

# Agent toolbox sandbox

> `python_executor` runs model-written code in **its own process**, with a module allowlist, 256 MB of memory, a hard timeout and at most 8 runs at once, confined to the working directory. With `SANDBOX_TOOL_ACCESS=true` the code can call the other tools as functions, through a bridge back to the toolbox.

Previous: [[Agent toolbox layers]] · Next: [[Agent toolbox republished tools]]

## Why code at all
Analysis tasks ("revenue growth per region, as a chart") would take many tool calls and copy data through the model's context. One program does it in one call, and the data never transits the model:
```python
import pandas as pd
rows = users_tables(query="SELECT country, COUNT(*) AS users FROM users GROUP BY country")
df = pd.DataFrame(rows["rows"])
file_writer(file_path="users_by_country.csv", data=df.to_csv(index=False))
result = df.sort_values("users", ascending=False).head(3).to_dict("records")
```

## How it's contained
| Limit | Stops |
|---|---|
| Separate process | A crash or infinite loop killing the server |
| Module allowlist (pycraftcore's `PYTHON_ALLOWLIST`: pandas, numpy, matplotlib, datetime…) | `import os, subprocess, socket` — shelling out, raw network |
| 256 MB memory, timeout, 8 concurrent runs | Resource exhaustion |
| Working directory | Reading `/etc`, writing outside the agent's folder |
| Tool calls only through `SandboxToolBridge` (pycraftcore `HostBridgeServer`) | Reaching backends except through validated tools |
| The pod's NetworkPolicy, no Kubernetes token, hardened pod | Everything else, if the above fail ([[Homelab LLM and agent]]) |
A Python-level sandbox is *not* a security boundary on its own — Python is too dynamic. That's why it's one layer among several ([[AI agents and sandboxing]], [[Least privilege and defence in depth]]).

## Errors the model can fix
On failure, the result keeps what the code printed before failing and a traceback **of its own lines only** (internal frames removed), so the model sees `line 3: rows[5] IndexError` and corrects it.

## Check yourself
1. Why is "data never transits the model" a cost *and* a privacy win?
> [!success]- Answer
> Cost: thousands of rows are handled in the sandbox and only the small result goes back, so the model reads a few tokens instead of the whole data set. Privacy: rows the model never sees can't leak through its answer or the provider's logs (NVIDIA's API by default).
2. Name two ways sandboxed code could still cause harm, and which layer stops each.
> [!success]- Answer
> Any two of: sending data out to the internet with a tool or an allowed module (only plan approval and the screen step stop it, since the fence allows the internet); exhausting resources with a huge loop or allocation (the 256 MB limit, the timeout and the 8-run cap); writing or deleting files in the working directory (only that directory is reachable); changing data through the MCP tools (their read-only accounts); escaping Python's allowlist through its dynamism (the separate process, the hardened pod with no Kubernetes token, and the NetworkPolicy).

## Go further
- [[pycraftcore runtime sandbox]] — how the runner is built.
- [Simon Willison: the lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/).
