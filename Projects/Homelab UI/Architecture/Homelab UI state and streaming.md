---
type: architecture
project: "[[Homelab UI]]"
order: 2
tags: [homelab-ui, architecture, frontend]
updated: 2026-11-08
---

# Homelab UI state and streaming

> State lives in small **signal stores** (`@Injectable({ providedIn: 'root' })` classes holding signals). Every call to a tool goes through one client, `GatewayApi`, which adds the CSRF header, a timeout and sign-in handling. The agent's answer arrives as a **server-sent event stream** read with `fetch`, token by token.

Previous: [[Homelab UI structure]] · Next: [[Homelab UI Tasker]]

**Do it:** [[Homelab UI - Extend a page]]

## Signal stores
`AgentStore` is the model of the chat. It holds `signal`s (`messages`, `draft`, `isStreaming`, `modelName`…) and `computed`s derived from them:
```ts
readonly canSend = computed(() => this.draft().trim().length > 0 && !this.isStreaming() && this.modelName() !== '');
readonly phase = computed<SwarmPhase>(() => { /* idle, thinking, executor, final, error */ });
```
- Templates read signals; Angular updates exactly the parts that depend on what changed — no zone.js, no manual change detection ([[Signals]]).
- `effect(() => this.preferences.write({...}))` saves the model and auto-approve choice whenever they change.
- Because the store is a root singleton, the **Agent page and the assistant drawer show one conversation**: they inject the same `AgentStore`.

## One client for every tool: `GatewayApi`
Every feature's API service calls `GatewayApi.json()/text()/send()`:
- adds `X-Homelab-Request: 1` — the gateway refuses writes without it ([[CSRF]]);
- `AbortSignal.timeout(15 s)` combined with the caller's signal (`AbortSignal.any`);
- on `401`: the session ended → `GatewaySession.signIn()` sends the browser to the sign-in page;
- turns error bodies into one readable message (`GatewayApiError`).

`GatewaySession` reads the account from `/oauth2/userinfo` at start-up (an app initializer), shows it in the sidebar, re-checks every minute and when the tab comes back, and knows whether you have the `admin` role.

## The agent stream
`POST /api/agent/v1/stream` answers `text/event-stream` ([[Server-sent events]]). `EventSource` can't POST, so `AgentApiService.stream()` reads the body itself:
```text
fetch ─► response.body.getReader() ─► TextDecoder ─► buffer
      ─► split on "\n\n" (one frame) ─► "event: …" + "data: {json}" ─► yield StreamEvent
```
It's an `async *` generator: the store does `for await (const event of api.stream(...))` and updates signals per event:
| Event | The store |
|---|---|
| `status` | shows progress ("Formulating a plan") and moves the swarm avatar |
| `token` | appends to the answer being written |
| `final` | replaces it with the full answer and keeps `metadata` (time, tokens, model, tools) |
| `error` | shows the error |
| `complete` | stops streaming |

An `AbortController` cancels the request when you start a new conversation. The agent's `: heartbeat` comments keep proxies from closing quiet streams; the parser ignores lines that aren't `event:` or `data:`.

## Check yourself
1. Why does the assistant drawer show the same conversation as the Agent page?
> [!success]- Answer
> `AgentStore` is `providedIn: 'root'`: one instance for the whole app. The Agent page and the drawer inject the same store, so they read the same signals.
2. Why can't `EventSource` be used here, and what replaces it?
> [!success]- Answer
> `EventSource` only makes GET requests, without a body or custom headers, and the agent needs `POST /api/agent/v1/stream` with a JSON body and `X-Homelab-Request`. `AgentApiService.stream()` uses `fetch`, reads `response.body` with a reader, and parses the frames in an async generator.
3. What would break if `GatewayApi` didn't add `X-Homelab-Request`?
> [!success]- Answer
> Caddy's `no_cross_site_writes` would refuse every write with 403: sending a message to the agent, saving a Tasker workflow, unloading a model, every POST, PUT or DELETE. Reads would still work.

## Go further
- [Angular signals](https://angular.dev/guide/signals).
- [MDN: ReadableStream.getReader](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream/getReader), [AbortSignal.any](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static).
