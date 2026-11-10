---
type: path
track: Platform
time: ~10 h
projects: ["[[Homelab]]"]
tags: [path]
updated: 2026-11-10
---

# Path - Containers and Kubernetes

> **Goal:** read any pod's state and explain it; know what each Kubernetes object is for, how our charts use it, and which one to reach for.
> **Time:** ~10 h over 3–4 sessions.
> **Before:** [[Path - Linux, Git and the server]] · [[Path - Networks you can reason about]]. **Then:** [[Path - Shipping changes]] · [[Project - Follow a request]]. **All paths:** [[Paths]]

## Principles → projects
| Principle | Where it lives in our projects |
|---|---|
| Containers are isolated processes | every pod; k3s' containerd; `crictl` on the server |
| Desired state and reconciliation | Deployments recreate deleted pods; CloudNativePG keeps PostgreSQL as declared |
| Stable names in front of moving pods | `postgres-rw`, `keycloak`, `otel-collector` Services |
| Configuration outside the image | `configFiles` → ConfigMaps (Caddyfile, prometheus.yml); `secretEnv` → Secrets |
| Health decides traffic and restarts | startup/readiness/liveness probes in every values file |
| Tasks vs servers | Jobs (realm sync, migrations), CronJobs (backups) |

## Warm-up (optional, from the paths before)
1. What does `10.43.0.0/16` hold in k3s?
> [!success]- Answer
> Service IPs. Pods are in `10.42.0.0/16`.

## 1. Containers are processes · ~1.5 h

### Learn
**Definitions**
- **Container** — a Linux process isolated by **namespaces** (its own view of processes, network, mounts, hostname) and limited by **cgroups** (CPU, memory) ([[Containers]]).
- **Image** — the read-only files and metadata a container starts from, named `registry/repository:tag`, identified for sure by its **digest** ([[Container image]]).
- **Runtime** — the program that creates containers: containerd in k3s.
- **Pull policy** — `IfNotPresent` uses a cached image if the tag is there; `Always` asks the registry every start.

**How it works**
The kubelet asks containerd to start a container from an image: containerd unpacks the layers, creates namespaces and cgroups, and runs the image's command as PID 1 inside them. To the host it's an ordinary process.

**Example from our projects** — an app's image reference, rendered from `apps.homelabUi` in `versions.yaml`:
```text
docker.io/toufik142/homelab-ui:1.1.3        ← tag: a name the publisher can move
sha256:<64 hex characters>                 ← digest: the exact content running
```
`kubectl … -o jsonpath='{…imageID}'` shows the digest — the only proof of which build runs.

**Common mistake** — rebuilding and pushing the same tag: `IfNotPresent` keeps the old cached image. Release a new version instead.

### Do
1. 👀 `sudo k3s crictl ps | head`; `sudo k3s crictl images | grep toufik142`.
2. 👀 `ps -eo pid,user,comm | grep -E 'caddy|postgres|mongod'` → containers as host processes, numeric users.
3. 👀 `kubectl -n homelab get pod -l app.kubernetes.io/name=homelab-ui -o jsonpath='{.items[0].status.containerStatuses[0].imageID}'; echo`.

### Check
1. Why is `mongod` visible in the host's `ps`, and what does that say about containers versus VMs?
> [!success]- Answer
> A container is a host process isolated by namespaces and cgroups; the kernel is shared, so the host sees it. A VM runs its own kernel, invisible in the host's process list.

**You can now:** explain what a container is and which build is running.

## 2. The control loop · ~1 h

### Learn
**Definitions**
- **Object** — a record in the Kubernetes API (`Pod`, `Deployment`, `Service`…) with a `spec` (desired) and a `status` (observed).
- **Controller** — a loop that compares spec and status and acts to close the gap.
- **Namespace** — a folder for objects; ours `homelab` (operators in `cnpg-system`, `reloader`).
- **Label / selector** — key-value tags (`app.kubernetes.io/name: caddy`) and queries on them; how objects find each other.

**How it works**
```text
you ─ YAML ─► API server ─► etcd (desired)       controllers: observe → compare → act → repeat
                                 └─► scheduler picks a node ─► kubelet starts containers ─► status reported back
```

**Example from our projects** — the labels every pod gets from the chart, and how commands use them:
```yaml
labels:
  app.kubernetes.io/name: homelab-ui
  app.kubernetes.io/instance: homelab-ui
```
`make logs R=homelab-ui` runs `kubectl -n homelab logs -l app.kubernetes.io/instance=homelab-ui …` — by label, never by pod name (pod names change).

**Common mistake** — `kubectl delete pod` to "stop" a service: the controller makes a new one. Stop by scaling to 0 or uninstalling.

### Do
1. 👀 `kubectl get nodes -o wide` → one node, `10.250.0.1`.
2. ✋ `kubectl -n homelab delete pod -l app.kubernetes.io/name=homelab-ui`, then `kubectl -n homelab get pods -l app.kubernetes.io/name=homelab-ui -w` → a new pod within seconds. Nothing to undo.

### Check
1. Who created the new pod, and how did it know to?
> [!success]- Answer
> The Deployment's controller (through its ReplicaSet): desired 1 replica, observed 0 → create one. The reconciliation loop.

**You can now:** predict what Kubernetes does when something changes. Deep dive: [[Kubernetes]] · [[k3s]].

## 3. Workloads and their identity · ~2 h

### Learn
**Definitions**
- **Pod** — one or more containers sharing an IP and volumes, scheduled together ([[Pod]]).
- **Deployment** — keeps N interchangeable pods; rolling updates. **StatefulSet** — pods with stable names (`mongodb-0`) and one volume each ([[Deployment and StatefulSet]]).
- **requests / limits** — CPU and memory reserved for scheduling / the hard ceiling (above the memory limit: `OOMKilled`).
- **Rollout strategy** — `RollingUpdate` (new up, then old down) or `Recreate` (old down, then new up).
- **Operator** — a controller that operates one kind of software from a custom resource ([[Operator]]).

**How it works**
The `app` chart's `kind:` chooses the controller; it switches to `Recreate` when a pod has volumes or host ports, because on one node two copies can't share them.

**Example from our projects** — MongoDB's values (`repository/mongodb/values.yaml.gotmpl`, excerpt):
```yaml
kind: StatefulSet
args: [mongod, --wiredTigerCacheSizeGB, "1"]
ports:
  - { name: mongodb, port: 27017, hostPort: 27017 }
resources:
  requests: { cpu: 100m, memory: 512Mi }
  limits: { memory: 3Gi }
persistence:
  data:
    mountPath: /data/db
    size: 20Gi
```
1. `StatefulSet` — stable identity `mongodb-0` and its own volume.
2. `wiredTigerCacheSizeGB 1` — MongoDB's cache stays well under the 3 Gi limit, leaving room for connections and the OS.
3. `requests` reserve 512 Mi for scheduling; `limits` kill it above 3 Gi.
4. `hostPort` + volume → `Recreate` updates: a few seconds down per upgrade.

**Common mistake** — a memory limit without matching the app's own cache settings: the app happily grows to its default cache and is `OOMKilled`.

### Do
1. 👀 `kubectl -n homelab get deploy,statefulset`.
2. 👀 `kubectl -n homelab get clusters.postgresql.cnpg.io` → PostgreSQL is run by an operator.
3. 👀 `make top` → memory per pod against the limits in [[homelab-infra]].

### Check
1. A pod shows `OOMKilled`. What happened and what do you change?
> [!success]- Answer
> It exceeded its memory limit and the kernel killed it. Fix a leak or tune the app's caches, or raise `resources.limits.memory` in its values file, then `make apply R=<release>`.

## 4. Finding each other: Services · ~1 h

### Learn
**Definitions**
- **Service** — a stable virtual IP and DNS name in front of the pods matching its selector ([[Service]]).
- **EndpointSlice** — the list of Ready pod IPs behind a Service.
- **ClusterIP** — the default type: reachable inside the cluster only.

**How it works**
Only pods passing their readiness probe are in the EndpointSlice; traffic to the Service IP is forwarded to one of them.

**Example from our projects** — the database URL PostgREST uses (`repository/postgrest/values.yaml.gotmpl`):
```yaml
PGRST_DB_URI: host=postgres-rw port=5432 dbname=homelab user=postgrest password=$(POSTGREST_PASSWORD) sslmode=require
```
`postgres-rw` is a Service CloudNativePG keeps pointing at the primary — the pod can change, the name doesn't. `$(POSTGREST_PASSWORD)` is filled from another env variable set from a Secret.

**Common mistake** — connecting to a pod IP: it changes at every restart.

### Do
👀 `kubectl -n homelab get svc postgres-rw keycloak`; `kubectl -n homelab get endpointslices -l kubernetes.io/service-name=keycloak`.

### Check
1. A pod is `Running` but `0/1` Ready. Does its Service send it traffic?
> [!success]- Answer
> No: only Ready pods are in its endpoints.

## 5. Config, secrets and data · ~2 h

### Learn
**Definitions**
- **ConfigMap / Secret** — key-value objects mounted as files or env variables; Secrets are base64-encoded, encrypted at rest only if the cluster does it (k3s here) ([[ConfigMap and Secret]]).
- **PersistentVolumeClaim** — a request for storage; k3s' local-path provisioner makes a folder per claim ([[Volumes]]).
- **hostPath / emptyDir** — a node folder / scratch space for the pod's life.
- **Reloader** — restarts pods when a Secret they use changes.

**How it works**
The chart turns `configFiles:` into ConfigMaps (and a checksum annotation on the pod), `secretEnv:` into env variables read from Secrets, `persistence:` into claims kept across uninstalls.

**Example from our projects** — Keycloak's values (excerpt):
```yaml
secretEnv:
  KC_DB_PASSWORD: { secret: pg-role-keycloak, key: password }
configFiles:
  sync:
    mountPath: /opt/keycloak/sync
    files:
      sync.sh: |
        {{- readFile "sync.sh" | nindent 8 }}
```
1. `secretEnv` — the password never appears in values or git: the pod reads key `password` of Secret `pg-role-keycloak`.
2. `configFiles` — `sync.sh` from git becomes a file in the pod; edit it → checksum changes → new pod.
3. `readFile … | nindent 8` — helmfile's template pulls the file in, indented into the YAML ([[YAML and templating]]).

**Common mistake** — a new Secret added to a release but not created: the pod sits in `CreateContainerConfigError`. `make secrets` creates what's missing.

### Do
1. 👀 `kubectl -n homelab get configmap | head`; `make secrets-list`.
2. 👀 `kubectl -n homelab get pvc`; `sudo ls /var/lib/rancher/k3s/storage/ | head`.

### Check
1. You change the Caddyfile and apply. Why does Caddy restart, when Kubernetes doesn't restart pods on ConfigMap changes?
> [!success]- Answer
> The chart puts a checksum of the config files in a pod-template annotation; a changed file changes the template, so the Deployment rolls out a new pod.

## 6. Health and tasks · ~1.5 h

### Learn
**Definitions**
- **Startup / readiness / liveness probe** — finished starting? / take traffic now? / stuck, restart me? ([[Probes]]).
- **Job / CronJob** — runs to completion / on a schedule; Helm **hooks** run Jobs on deploy ([[Jobs and CronJobs]]).

**How it works**
Readiness gates traffic (and helmfile's wait); liveness restarts; startup holds the other two off until the app has started.

**Example from our projects** — Keycloak's probes:
```yaml
probes:
  startup:
    httpGet: { path: /health/started, port: management }
    periodSeconds: 5
    failureThreshold: 60
  readiness:
    httpGet: { path: /health/ready, port: management }
    periodSeconds: 10
  liveness:
    httpGet: { path: /health/live, port: management }
    periodSeconds: 20
    failureThreshold: 6
```
Startup allows 60 × 5 s = 5 minutes to boot (Keycloak is slow); then readiness every 10 s; liveness restarts it only after 6 × 20 s = 2 minutes of failures.

**Common mistake** — a liveness probe that checks the database: a database blip restarts every app at once.

### Do
1. 👀 `kubectl -n homelab get jobs,cronjobs`; `kubectl -n homelab logs job/keycloak-sync | tail -5` → `keycloak sync done`.

### Check
1. Why should liveness never check a dependency?
> [!success]- Answer
> When the dependency blips, every pod's liveness fails and Kubernetes restarts them all, making the outage worse. Dependencies belong in readiness.

**Milestone:** given `make status`, you can say what each state means and the next command to run ([[Homelab failure modes]]).
