---
type: path
track: Applications
time: ~9 h
projects: ["[[Homelab UI]]"]
tags: [path]
updated: 2026-11-10
---

# Path - The frontend

> **Goal:** read and extend homelab-ui confidently: how an Angular app is organised, how state flows, how it streams the agent, how its editor works, how it's tested and shipped.
> **Time:** ~9 h.
> **Before:** [[Path - Tour of Homelab UI]] · [[Path - Networks you can reason about]]. **Then:** [[Path - Models]]. **All paths:** [[Paths]]

## Principles → projects
| Principle | Where it lives in our projects |
|---|---|
| Single-page app, lazy routes | `app.routes.ts`, the nginx image |
| Components and DI | standalone components, `inject()`, `HOMELAB_FEATURES` |
| Reactive state with signals | `AgentStore`, Tasker's stores |
| Feature-first layers | `features/<page>/{domain,application,infrastructure,pages}` |
| Streaming with fetch | `agent-api.service.ts` |
| Ports on the frontend | Tasker's `CanvasEngine` |
| Tests next to the code | `*.spec.ts`, vitest |

## Warm-up (optional)
1. Why does `/api/*` answer 401 instead of redirecting?
> [!success]- Answer
> It's called by the app's `fetch()`; a 401 lets the app send the browser to sign in.

## 1. An app in the browser · ~1.5 h

### Learn
**Definitions**
- **SPA** — one HTML page; the router swaps views; data from APIs ([[Single-page application]]).
- **Component** — a class + template + styles; **standalone** lists its own imports ([[Angular]]).
- **Template syntax** — `{{ value }}`, `[prop]="expr"`, `(event)="handler()"`, `@if`, `@for`.
- **Bundle / chunk** — the built JavaScript; lazy routes produce one chunk per page.
- **Zoneless** — change detection driven by signals, without zone.js patching every async call.

**How it works** — `ng build` compiles TypeScript and templates into static files; nginx serves them; the browser loads `index.html`, the main bundle, then each page's chunk on first visit.

**Example from our projects** — a lazy route (`app.routes.ts`):
```ts
{
  path: 'metrics',
  loadComponent: () =>
    import('./features/prometheus/pages/metrics-page/metrics-page').then((m) => m.MetricsPage),
},
```

**Common mistake** — eager-importing pages in the routes file: the first load downloads every page.

### Do (in `homelab-ui`)
1. `make install`, `make run` → `http://localhost:4200`. The Agent page works; most tool pages don't (they need the gateway).
2. Devtools → Network: navigate to Metrics → a new chunk loads.

### Check
1. Why do tool pages fail under `npm start`?
> [!success]- Answer
> In `direct` mode the app calls tools on their ports; their APIs are reachable only behind the gateway's `/api/<tool>/` routes with the session cookie.

## 2. Structure · ~1.5 h

### Learn
**Definitions**
- **Shell** — app chrome: layout, menu, right panel, drawer ([[Homelab UI structure]]).
- **Feature contract** — `HomelabFeature`: what a page tells the shell.
- **Multi provider** — many providers adding to one injection token's array ([[Dependency injection]]).

**Example from our projects** — the contract (`shell/domain/homelab-feature.ts`) and the token:
```ts
export interface HomelabFeature {
  id: string;
  label: string;
  description: string;
  icon: FeatureIcon;
  color: string;
  category: FeatureCategory;
  entry: FeatureEntry;
  adminOnly?: boolean;
  checkHealth?: () => Promise<boolean>;
}
export const HOMELAB_FEATURES = new InjectionToken<readonly HomelabFeature[]>('HOMELAB_FEATURES');
export function provideHomelabFeature(describe: () => HomelabFeature): Provider {
  return { provide: HOMELAB_FEATURES, multi: true, useFactory: describe };
}
```

**Common mistake** — a feature importing another feature: the rule erodes; shared code goes to `shared/`.

### Do
👀 `app.config.ts`; `features/kafka-ui/` and `kafka-ui.feature.ts`.

### Check
1. How does the menu list Kafka without the shell importing it?
> [!success]- Answer
> Kafka registers with `provideHomelabFeature(...)`, a multi provider for `HOMELAB_FEATURES`; the shell injects the token and gets every registered feature.

## 3. State and streaming · ~2 h

### Learn
**Definitions**
- **signal / computed / effect** — a reactive value / a derived one / a side effect on change ([[Signals]]).
- **Root singleton** — `@Injectable({ providedIn: 'root' })`: one instance for the whole app.
- **ReadableStream reader** — reads a response body chunk by chunk.

**Example from our projects** — `AgentStore` (excerpt):
```ts
readonly messages = signal<ChatMessage[]>([]);
readonly isStreaming = signal(false);
readonly canSend = computed(() => this.draft().trim().length > 0 && !this.isStreaming() && this.modelName() !== '');
constructor() {
  effect(() => {
    this.preferences.write({ modelName: this.modelName(), autoApprove: this.autoApprove() });
  });
}
```
`canSend` recomputes only when `draft`, `isStreaming` or `modelName` change; the `effect` saves preferences whenever they change. The stream parser: [[Path - Tour of Homelab UI]], lesson 4.

**Common mistake** — using `effect` to derive state (setting one signal from another): use `computed`.

### Do
👀 `features/agent/application/agent.store.ts`, `infrastructure/api/agent-api.service.ts`; open the Agent page and the drawer side by side.

### Check
1. Why are the Agent page and the drawer always in sync?
> [!success]- Answer
> Both inject the same root `AgentStore`; its signals are the single source of truth.

## 4. An editor in plain TypeScript · ~2 h

### Learn
**Definitions**
- **Graph** — blocks (nodes) and connections (edges); **breadth-first** — visit level by level using a queue.
- **Port (frontend)** — `CanvasEngine`: the interface the page uses; Rete.js is its adapter ([[Homelab UI Tasker]]).

**Example from our projects** — `executeGraph` (`features/tasker/domain/graph-execution.ts`, excerpt):
```ts
while (queue.length > 0) {
  const id = queue.shift()!;
  const block = byId.get(id);
  if (!block || visited.has(id)) continue;
  visited.add(id);
  const input = seeds.has(id) ? seeds.get(id) : upstreamOutput(graph, id, outputs);
  hooks.onStart?.(id);
  try {
    const output = await hooks.execute(block, input, outputs);
    outputs.set(id, output);
    hooks.onSuccess?.(id, output);
    for (const connection of graph.connections) {
      if (connection.fromId === id) queue.push(connection.toId);
    }
  } catch (error) { /* record it, call onError; downstream blocks are not queued */ }
}
```

**Common mistake** — putting execution logic in the component: untestable without a browser. Here it's a pure function with a spec.

### Do
👀 `graph-execution.ts` and its spec; build Trigger → HTTP → Output on the homelab and run it.

### Check
1. A middle block fails. What happens after it?
> [!success]- Answer
> Its downstream blocks never run: only a success queues the next blocks; the error is recorded and shown.

## 5. Tested and shipped · ~2 h

### Learn
**Definitions**
- **vitest** — the test runner (`ng test`), specs next to the code ([[Unit tests and test doubles]]).
- **Multi-stage build** — build in one image, copy the result into a small runtime image ([[Container image]]).

**Example from our projects** — `devops/docker/Dockerfile`:
```dockerfile
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --from=builder /app/dist/homelab-ui/browser /usr/share/nginx/html
COPY devops/docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
```
1. Copy `package*.json` first: the `npm ci` layer is cached until dependencies change.
2. `$BUILDPLATFORM`: build once natively; the static files are the same for every CPU.
3. The runtime image has no Node: nginx and files only, unprivileged, port 8080.

**Common mistake** — a plain `docker build` on an Apple-silicon Mac: an arm64-only image that fails on the x86 server (`exec format error`).

### Do
`make check` → prettier, `tsc`, vitest green.

**Milestone:** you can add a page and explain how data flows from the gateway to a signal to the screen.
