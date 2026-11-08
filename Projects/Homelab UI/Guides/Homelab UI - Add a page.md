---
type: guide
project: "[[Homelab UI]]"
tags: [guide, homelab-ui]
updated: 2026-11-08
---

# Homelab UI - Add a page

> Add a new page: its feature folder, component, route, registration in the menu and control center, and optionally a right-sidebar panel.

**Where:** on your Mac, in `homelab-ui` · **All guides:** [[Homelab UI guides]]

Worked example: adding a `Metrics` page. Substitute your own name throughout (route path, feature id, folder name).

## 1. Scaffold the feature folder

```
src/app/features/metrics/
├── domain/
├── application/
├── infrastructure/     (only if the page talks to a backend)
├── components/         (only once you have more than one presentational piece)
└── pages/metrics-page/
```

Skip any of `domain`/`application`/`infrastructure` the page doesn't need yet — `alloy` has no `application`. Add a layer only when it actually has something to hold; an empty folder documents nothing.

## 2. Build the page component

```ts
// features/metrics/pages/metrics-page/metrics-page.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-metrics-page',
  imports: [],
  templateUrl: './metrics-page.html',
  styleUrl: './metrics-page.scss',
})
export class MetricsPage {}
```

Give the page's `:host` this shape so it fills the space the shell gives it (see `agent-page.scss`); a tool page wraps its content in `<div class="hl-page">` and starts with `<app-page-header>`:

```scss
:host {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  width: 100%;
}
```

## 3. Register the route

```ts
// app.routes.ts
{
  path: 'metrics',
  loadComponent: () =>
    import('./features/metrics/pages/metrics-page/metrics-page').then((m) => m.MetricsPage),
},
```

Lazy (`loadComponent`) keeps each page its own bundle chunk — a new page never grows the main bundle.

## 4. Register the feature

The left nav and the control center list registered features. Add a registration next to the page:

```ts
// features/metrics/metrics.feature.ts
export function provideMetricsFeature(): Provider {
  return provideHomelabFeature(() => ({
    id: 'metrics',
    label: 'Metrics',
    description: 'Host and container metrics.',
    category: 'Observability',
    icon: ['M4 20V10M10 20V4M16 20v-7M22 20H2'],
    entry: { kind: 'page', path: '/metrics' },
  }));
}
```

and list it in `app.config.ts` (`provideMetricsFeature()`). If the page talks to a backend, give it `infrastructure/metrics.json` (with `api`), an API service on `GatewayApi`, and a `checkHealth` (see `features/kafka-ui`). `adminOnly: true` hides it from accounts without the `admin` role.

## 5. Give it a right-sidebar panel (optional)

Only do this if the page has settings/controls that belong in the right sidebar. Wrap that content in `<ng-template appPagePanelContent>` inside the page's own template:

```html
<!-- metrics-page.html -->
<ng-template appPagePanelContent>
  <app-metrics-settings />
</ng-template>

<div class="metrics-page">... the page's main content ...</div>
```

```ts
import { PagePanelContentDirective } from '@shell/directives/page-panel-content.directive';

@Component({
  imports: [PagePanelContentDirective /* , ... */],
  // ...
})
export class MetricsPage {}
```

That's the entire contract: register the template, and the shell shows/hides the right sidebar and its mobile toggle automatically. Skip this step and the page simply has no right sidebar — that's how `status` and the tool pages work.

## 6. Verify

`make run`, open `http://localhost:4200`: the new page appears in the left nav and in the control center's apps, `/metrics` routes to it, the assistant button shows at the top right, and (if step 5 was done) its settings show in the right sidebar.

## If it goes wrong
- The page calls a backend: [[Homelab UI - Extend a page#Call a new API]].

## Why it works
- [[Homelab UI structure]] — the feature contract and why the shell never imports a feature.
- [[Feature-first architecture]] · [[Angular]] · [[Dependency injection]]
