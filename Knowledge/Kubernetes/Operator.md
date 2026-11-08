---
type: concept
domain: Kubernetes
level: intermediate
tags: [concept, kubernetes]
updated: 2026-11-08
---

# Operator

> A program running in the cluster that knows how to operate one kind of software — a database, a broker — exposed as a new kind of Kubernetes object (a **custom resource**). You declare "a PostgreSQL cluster with these roles", the operator does what a DBA would.

## Why it matters
Kubernetes knows how to keep pods running, not how to fail over a database, rotate a role's password or take a consistent backup. Operators encode that expertise as a controller with the same reconciliation loop as the built-in ones ([[Kubernetes]]).

## How it works
- A **CustomResourceDefinition** (CRD) adds a type to the API: `clusters.postgresql.cnpg.io`.
- The operator watches objects of that type and creates the real resources (pods, Services, Secrets, PVCs), then keeps them matching — and reports progress in the object's `status`.
- `kubectl get clusters.postgresql.cnpg.io -n homelab` works like any built-in object.

## In our projects
- **CloudNativePG** runs PostgreSQL: kube-charts' `pg-cluster` chart renders one `Cluster` with `managed.roles` (each role's login, memberships, password Secret) and `Database` objects. The operator creates `postgres-rw`, TLS certificates, the `postgres-superuser` and `postgres-app` Secrets, a metrics exporter, and re-applies role passwords when a Secret labelled `cnpg.io/reload` changes. See [[Homelab data]].
- **Reloader** is a small controller: it watches Secrets and ConfigMaps and restarts the Deployments/StatefulSets that use them.
- helmfile's postsync hook waits for `condition=Ready` on the `Cluster`.

## Pitfalls we met
- Role status: `kubectl get clusters.postgresql.cnpg.io postgres -o jsonpath='{.status.managedRolesStatus}'` — a role the operator couldn't create shows there, not in pod logs.
- CRDs must be installed before objects of their type: hence `postgres` needs `cnpg`, and helmfile's `disableValidationOnInstall`.

## Check yourself
1. What's a CRD, and what's the difference between installing one and running an operator?
2. Name three things CloudNativePG does that a plain StatefulSet wouldn't.

## Go further
- [Operator pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/), [Custom resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/).
- [CloudNativePG docs](https://cloudnative-pg.io/documentation/current/).
- [Reloader](https://github.com/stakater/Reloader).
