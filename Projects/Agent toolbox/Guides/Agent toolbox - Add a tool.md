---
type: guide
project: "[[Agent toolbox]]"
tags: [guide, agent-toolbox]
updated: 2026-11-08
---

# Agent toolbox - Add a tool

> Write a new tool: its input and output models, its class, its backend connector, its registration and tests. The agent discovers it at its next start.

**Where:** on your Mac, in `agent-toolbox` · **All guides:** [[Agent toolbox guides]]

1. Define its input and output as pydantic models (`adapter/outbound/<area>/model/`). Field descriptions become the MCP schema the agent reads.
2. Subclass `Tool[Input, Output]` with a `name`, a `description` written for the model, and `async run(arguments)`. Raise `ToolFailure` with a clear message when the call can't be served.
3. If it needs a backend (a database, an API, …), add a connector in `config/<APP_ENV>/connector/`, list it in `config/root.yml`, put its variables in `.env.example`, and build the client in `ToolboxDI` from that connector.
4. Register it in `ToolboxDI._invoke_tool_use_case`. It is then published over MCP and, when `SANDBOX_TOOL_ACCESS` is on, callable from `python_executor` code — no change needed in the agent, which discovers it at its next start.
5. Add unit tests next to the others, and its row to [[Agent toolbox]].

```python
class CountRows(Tool[CountRowsInput, CountRowsOutput]):
    name = "count_rows"
    description = "Count the rows of a table in the service database."
    input_model = CountRowsInput
    output_model = CountRowsOutput

    async def run(self, arguments: CountRowsInput) -> CountRowsOutput: ...
```

## Why it works
- [[Agent toolbox layers]] — why a tool knows nothing about MCP.
- [[Data validation with pydantic and msgspec]] · [[Dependency injection]]
