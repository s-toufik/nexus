---
type: concept
domain: AI
level: intermediate
tags: [concept, ai, agents]
updated: 2026-11-08
---

# LangGraph

> A library for running LLM workflows as a **state graph**: nodes are steps (functions reading and updating a shared state), edges (possibly conditional) choose the next node, and a **checkpointer** saves the state after each step so a conversation can continue, resume or be inspected later.

## How it works
- `StateGraph(State)`, `add_node(name, fn)`, `add_edge(a, b)`, `add_conditional_edges(a, router)`, `compile(checkpointer=…)`.
- **Thread id** (`configurable.thread_id`) = one conversation's saved state; checkpointers for memory, SQLite, Postgres, MongoDB.
- Interrupts (human in the loop), subgraphs, streaming of node updates.
- Built by the LangChain team; works with or without LangChain models.

## In our projects
agent-runtime runs its steps as a LangGraph graph **generated from `TurnPolicy`**, with a MongoDB checkpointer (SQLite fallback), keyed by `request_id`. LangGraph is an adapter: the same steps also run on a plain loop in tests ([[Agent runtime turn]], [[Agent runtime decisions]]).

## Check yourself
1. What does the checkpointer give a chat agent?
> [!success]- Answer
> Memory between calls: the state is saved after each step under the thread id, so the next message continues the same conversation, a paused plan can be resumed after approval, even after a restart, and past states can be inspected when debugging.
2. Why keep routing rules out of graph code?
> [!success]- Answer
> So the rules stay in the domain, testable without LangGraph: agent-runtime keeps them in `TurnPolicy` and generates the graph from it. The same steps run on a plain loop in tests, and swapping the library touches only the adapter.

## Go further
- [LangGraph concepts](https://langchain-ai.github.io/langgraph/concepts/low_level/), [persistence](https://langchain-ai.github.io/langgraph/concepts/persistence/).
