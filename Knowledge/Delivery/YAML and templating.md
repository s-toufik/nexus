---
type: concept
domain: Delivery
level: beginner
tags: [concept, delivery]
updated: 2026-11-10
---

# YAML and templating

> **YAML** is the configuration format of Kubernetes, Helm, helmfile, CI and our services: indentation-based maps and lists. **Templating** (Go templates in Helm and helmfile, `${oc.env:…}` in OmegaConf) fills values into it before it's used.

## How it works
```yaml
env:                     # a map
  LOG_LEVEL: INFO
ports:                   # a list of maps
  - { name: http, port: 8000 }
args: [--transport=sse]  # flow style list
```
- **Gotchas:** indentation is structure; `yes`/`no`/`on` may become booleans and `0123` octal — quote strings (`"0123"`); a tab breaks it.
- **Go templates:** `{{ .Values.images.caddy | quote }}`, `{{- if not .Values.mcp.grafana.write }}…{{- end }}`, `{{ readFile "Caddyfile" | nindent 8 }}`; `-` trims whitespace; `nindent` indents a block.
- **Two passes in helmfile:** the helmfile itself is rendered first, so templates meant for later are escaped: `` {{`{{ .Release.Name }}`}} `` ([[helmfile]]).
- **OmegaConf:** `${oc.env:WEB_DOCS,false}` reads an env variable with a default; `${connector.weather}` points at another entry ([[pycraftcore configuration]]).
- `make template R=…` shows what Helm really renders — debug the output, not the template.

## In our projects
Every `values.yaml.gotmpl` in homelab-infra; `config/` in every Python service.

## Check yourself
1. Why quote `"0640"` in a k3s config?
2. What does `nindent 8` do, and when do you need it?

## Go further
- [Helm: chart template guide](https://helm.sh/docs/chart_template_guide/), [YAML: the Norway problem](https://hitchdev.com/strictyaml/why/implicit-typing-removed/).
