---
type: concept
domain: Delivery
level: beginner
tags: [concept, delivery, containers]
updated: 2026-11-12
---

# Container image

> A packaged, read-only file system plus metadata (which command to run, which user, which ports) that runs the same anywhere. Built from a **Dockerfile**, stored in a **registry**, identified by a name, a **tag** and a **digest**.

## Why it matters
"It works on my machine" ends here: the image *is* the machine, minus the kernel. Every service in a cluster runs from an image, so knowing how images are named, cached and pulled explains a whole class of deploy surprises.

## How it works
- **Layers**: each Dockerfile instruction adds a layer; layers are cached and shared between images.
- **Name**: `registry/repository:tag` — `docker.io/toufik142/homelab-ui:1.1.3`, `ghcr.io/cloudnative-pg/postgresql:18.6-standard-trixie`.
- **Tag** = a movable label. **Digest** (`sha256:…`) = the content's fingerprint, immutable. The same tag can point to different digests over time.
- **Pull policy**: `IfNotPresent` (use the cached image if the tag is there), `Always` (check the registry every start).
- **Multi-stage builds** keep build tools out of the final image; small base images (`alpine`, `distroless`) shrink the attack surface.
- Registries: Docker Hub, GHCR (GitHub), Quay. Charts can live in registries too, as **OCI artifacts**.

## In our projects
- Apps are built by GitHub Actions on a tag and pushed to Docker Hub as `toufik142/<app>:X.Y.Z`; a tag on `develop` pushes a pre-release `X.Y.Z-rc.N`; `latest` and `dev` follow the last release and pre-release ([[CI with GitHub Actions]]).
- k3s pulls with a Docker Hub read-only login (`registries.yaml`) to avoid anonymous rate limits.
- Image versions of every service are in `environments/versions.yaml` ([[Homelab deployment]]).

## Pitfalls we met
- **Rebuilt same tag, old code runs**: `IfNotPresent` keeps the cached image. Never reuse a tag; or remove it with `sudo k3s crictl rmi`.
- **`dev` tag**: same trap; deploy `X.Y.Z-rc.N`, which never moves.
- Check what really runs: the pod's `imageID` digest.

## Check yourself
1. What's the difference between a tag and a digest, and which one would you pin for full reproducibility?
> [!success]- Answer
> A tag is a name that can be moved to other content; a digest (`sha256:…`) is the content's fingerprint and never changes. For full reproducibility pin the digest (`image@sha256:…`).
2. Why does `IfNotPresent` make mutable tags dangerous?
> [!success]- Answer
> `IfNotPresent` only checks that the tag is on the node. If the tag now points to new content, a node that already has it keeps running the old image, so two nodes or two restarts can run different code under the same name.

## Go further
- [Docker: what is an image?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/)
- [Dockerfile best practices](https://docs.docker.com/build/building/best-practices/).
- [Kubernetes: images and pull policy](https://kubernetes.io/docs/concepts/containers/images/).
