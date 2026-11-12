---
type: concept
domain: Python
level: beginner
tags: [concept, python]
updated: 2026-11-08
---

# Data validation with pydantic and msgspec

> Declare the shape of data as a class with typed fields; the library validates incoming data against it (raising clear errors), converts types, and serialises back to JSON. **pydantic** is the most used; **msgspec** is a faster, stricter alternative.

## How it works
```python
class CountRowsInput(BaseModel):          # pydantic
    table: str = Field(description="Table to count")
class Order(msgspec.Struct):              # msgspec
    reference: str
```
- Validation at the **boundaries** (HTTP bodies, config, tool arguments, LLM structured output); inside, trust the types.
- Field descriptions feed generated schemas: OpenAPI docs, MCP tool schemas the model reads.
- pydantic `BaseSettings`-style models validate configuration.

## In our projects
- agent-toolbox: tool inputs/outputs as pydantic → MCP schemas ([[Agent toolbox layers]]).
- agent-runtime and the benchmark (Litestar): msgspec request/response schemas; FastAPI/BlackSheep: pydantic.
- pycraftcore: every settings object is pydantic ([[pycraftcore configuration]]).

## Check yourself
1. Why validate at the boundary and not everywhere?
> [!success]- Answer
> The boundary is where untrusted data arrives (HTTP, config, tool arguments, model output). Once it's checked and typed there, the code inside can trust the types; checking again everywhere only costs time and clutters the code.
2. How does a field description end up in front of the LLM?
> [!success]- Answer
> The description is part of the pydantic model's JSON schema; the toolbox publishes that schema as the MCP tool's input schema; agent-runtime passes it to the model as the tool definition, which the model reads to fill the arguments.

## Go further
- [pydantic](https://pydantic.dev/docs/), [msgspec](https://github.com/jcrist/msgspec).
