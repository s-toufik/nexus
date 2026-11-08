---
type: guide
project: "[[Homelab UI]]"
tags: [guide, homelab-ui]
updated: 2026-11-08
---

# Homelab UI - Run, test and build

> Run the UI on your Mac, run every check, build the static files or an image, and set up the pre-commit hooks.

**Where:** on your Mac, in `homelab-ui` · **All guides:** [[Homelab UI guides]]

## Every command

| To…                                                                                                                               | make                              | Raw command                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Install dependencies                                                                                                              | `make install`                    | `npm install`                                                                                                                |
| Dev server at `http://localhost:4200` (direct to the ports in `homelab-server.json`, no sign-in; the Status page shows _Unknown_) | `make run`                        | `npx ng serve`                                                                                                               |
| Tests (vitest)                                                                                                                    | `make test`                       | `npx ng test --watch=false`                                                                                                  |
| Format check / fix                                                                                                                | `make lint` / `make fix`          | `npx prettier --check .` / `npx prettier --write .`                                                                          |
| Type check                                                                                                                        | `make typecheck`                  | `npx tsc -p tsconfig.app.json --noEmit`                                                                                      |
| All checks                                                                                                                        | `make check`                      | lint + typecheck + test                                                                                                      |
| Production build to `dist/homelab-ui`                                                                                             | `make build`                      | `rm -rf dist && npx ng build`                                                                                                |
| Local image                                                                                                                       | `make docker_build`               | `docker build -f devops/docker/Dockerfile -t homelab-ui:local .`                                                             |
| Publish a test image (releases: git tag, see below)                                                                               | `make docker_publish [TAG=1.4.0]` | `docker buildx build --platform linux/amd64,linux/arm64 -f devops/docker/Dockerfile -t toufik142/homelab-ui:latest --push .` |

`npm start` calls the backends directly on their ports, without the gateway, from a machine on the tailnet: the Agent page and the assistant work against the server's agent-runtime (`http://<your-server>:8000`). The tool pages, PostgREST and the `/api/health` routes exist only behind the gateway, so they need the deployed UI (`https://<server>.<tailnet>.ts.net/`) or a dev image deployed with `helmfile -l name=homelab-ui apply --set image.tag=dev-<sha>` in homelab-infra ([[Homelab - Release an app#Try a dev image]]).

## Try it against a backend on your Mac

To try the UI against a backend running on your own machine, set `homelab-server.json` to `http://localhost` and the feature's `port` to the one your backend listens on. Every other feature then points to `localhost` too, so their status shows offline unless they run locally. Don't commit these edits.

## Set up the pre-commit hooks (once)

`.pre-commit-config.yaml` runs typecheck, format-check, and tests before each commit and push. `pre-commit` itself is a standalone tool, not an npm package, so install it once, globally:

```bash
pipx install pre-commit   # or: brew install pre-commit / pip install pre-commit
```

Then wire it into this repo (or just run `make hooks`):

```bash
pre-commit install --hook-type pre-commit --hook-type pre-push
```

Run it manually against everything at any time:

```bash
pre-commit run --all-files
```

## Why it works
- [[Homelab UI structure]] — what `npm start` talks to, and why the tool pages need the gateway.
- [[Angular]] · [[Unit tests and test doubles]] · [[Pre-commit hooks]]
