---
type: guide
project: "[[Homelab]]"
tags: [guide, homelab]
updated: 2026-11-14
---

# Homelab - Connect to the databases

> Open PostgreSQL and MongoDB from the server, from pgAdmin, Compass or mongosh, and give an app its own database user.

**Where:** on the server, or on your Mac where a step says so · **All guides:** [[Homelab guides]]

## From the server: psql and mongosh

- PostgreSQL: `make psql` — raw: `kubectl -n homelab exec -it "$(kubectl -n homelab get pod -l cnpg.io/cluster=postgres,cnpg.io/instanceRole=primary -o name)" -c postgres -- psql -d homelab`
- Keycloak's database: `\c keycloak` inside psql; agent-runtime's A2A tasks: `\c agent_runtime`, table `tasks`.
- MongoDB: `make mongosh` — raw: `kubectl -n homelab exec -it mongodb-0 -- sh -c 'mongosh -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin'`

## pgAdmin 4

Use `postgres`: it sees every table. PostgreSQL isn't open to the tailnet, so pgAdmin goes through SSH to the server.

1. **Get the password.** On the server: `make show-secrets` — raw: `./scripts/secrets.sh show`. The line `postgres-superuser/password` is it.
2. **Get PostgreSQL's address inside the cluster.** On the server:
   ```bash
   kubectl -n homelab get svc postgres-rw -o jsonpath='{.spec.clusterIP}'; echo
   ```
   It prints `10.43.x.x`. It stays the same unless the `postgres` release is removed.
3. **In pgAdmin 4: Object Explorer → right-click Servers → Register → Server.** General tab: a name, e.g. `homelab`. Then the **SSH Tunnel** tab: Use SSH tunneling on, Tunnel host `<HOMELAB_DOMAIN>`, port `22`, Username your user on the server, Authentication Identity file (your SSH key).
4. **Connection tab.** Host name the `10.43.x.x` address, Port `5432`, Maintenance database `homelab`, Username `postgres`, Password from step 1, Save password on.
5. **Save.** pgAdmin lists the databases `homelab`, `keycloak` and `agent_runtime`; the Tasker tables are in homelab → Schemas → tasker → Tables.

- `postgres` can change and drop anything: use it to look and for admin work, never in an app.
- pgAdmin says `connection timed out`: Tailscale isn't on on your Mac, or the address changed (step 2 again).

## Give an app its own PostgreSQL user

Its own: one user per app, which can only touch its own schema and what you grant it. Never `postgres` (everything) or `homelab` (owns the whole database). For an app `myapi`:

1. **Add its Secret to `SPECS` in [`scripts/secrets.sh`](https://github.com/s-toufik/homelab-infra/blob/develop/scripts/secrets.sh)**, and `pg-role-myapi/password` to `ROTATABLE`:
   ```
   "pg-role-myapi|kubernetes.io/basic-auth|username=myapi password:24"
   ```
   Then `make secrets` — raw: `./scripts/secrets.sh`. Secret `pg-role-myapi` is created with a generated password.
2. **Declare the user under `roles:` in [`repository/postgres/values.yaml.gotmpl`](https://github.com/s-toufik/homelab-infra/blob/develop/repository/postgres/values.yaml.gotmpl):**
   ```yaml
   - name: myapi
     login: true
     passwordSecret: { name: pg-role-myapi }
   ```
   Then `make apply R=postgres` — raw: `helmfile -l name=postgres apply`. The operator creates `myapi` with that password.
3. **Give it its schema in a migration.** `make migration-new NAME=create_myapi_schema`, write in the new file:
   ```sql
   -- migrate:up
   CREATE SCHEMA myapi AUTHORIZATION myapi;

   -- migrate:down
   DROP SCHEMA myapi CASCADE;
   ```
   Then `make migrate` — raw: `helmfile -l name=db-migrate sync`. `myapi` reads and writes everything in schema `myapi`, nothing else. To let it use other tables, grant them in the same migration, e.g. `GRANT SELECT ON tasker.workflows TO myapi;`.
4. **Point the app at it** in its repository's `devops/helm/values.yml`:
   ```yaml
   env:
     DB_HOST: postgres-rw
     DB_PORT: "5432"
     DB_NAME: homelab
   secretEnv:
     DB_USER: { secret: pg-role-myapi, key: username }
     DB_PASSWORD: { secret: pg-role-myapi, key: password }
   ```
   Use the env variable names your app reads. Release the app; it connects as `myapi`.

| Who | Username | Password in | Can |
|---|---|---|---|
| You, in pgAdmin | `postgres` | `postgres-superuser` | everything |
| Each app or API | its own (`myapi`) | `pg-role-myapi` | its schema and what you grant it |
| PostgREST (Tasker) | `postgrest` | `pg-role-postgrest` | the Tasker tables, only the signed-in user's rows |
| Keycloak | `keycloak` | `pg-role-keycloak` | the database `keycloak` |
| agent-runtime | `agent_runtime` | `pg-role-agent-runtime` | the database `agent_runtime` (its A2A tasks) |
| `homelab` | `homelab` | `postgres-app` | owns the database `homelab`; unused |

## MongoDB

MongoDB answers on the server's port 27017, from the tailnet only. The account is MongoDB's root: username `root`, password in Secret `mongodb`.

### From Compass, on your Mac

1. **Copy the password to your Mac's clipboard.** On your Mac:
   ```bash
   ssh <user>@<HOMELAB_DOMAIN> 'KUBECONFIG=/etc/rancher/k3s/k3s.yaml kubectl -n homelab get secret mongodb -o jsonpath={.data.password} | base64 -d' | pbcopy
   ```
   Nothing is printed; the password is in the clipboard.
2. **In Compass, click Add new connection** and set the URI to `mongodb://<HOMELAB_DOMAIN>:27017/?authSource=admin`, without the password.
3. **Open Advanced Connection Options → Authentication → Username/Password.** Username `root`, paste the password, Authentication Database `admin`.
4. **Save & Connect.** Compass lists the databases (`agent_runtime` is the agent's). It keeps the password on your Mac, so you do this once.

### From mongosh, on your Mac

```bash
mongosh "mongodb://root@<HOMELAB_DOMAIN>:27017/?authSource=admin"
```
It asks for the password: paste it (step 1 above).

### From the server

`make mongosh` — raw: `kubectl -n homelab exec -it mongodb-0 -- sh -c 'mongosh -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin'`. No password to type.

### From an app in the cluster

Host `mongodb`, port `27017`, authentication database `admin`, the user and password from Secret `mongodb`, as agent-runtime does in its `devops/helm/values.yml`:
```yaml
env:
  DB_MONGO_CHECKPOINT_HOST: mongodb
  DB_MONGO_CHECKPOINT_PORT: "27017"
secretEnv:
  DB_MONGO_CHECKPOINT_USERNAME: { secret: mongodb, key: username }
  DB_MONGO_CHECKPOINT_PASSWORD: { secret: mongodb, key: password }
```
Your app uses the env variable names it reads.

- `connection timed out`: Tailscale isn't on on your Mac, or MongoDB isn't running (`make status` on the server).
- `Authentication failed`: the password was rotated or mistyped; copy it again (step 1).
- A connection string with the password in it (`mongodb://root:<password>@…`) stays out of git and chats.

## Why it works
- [[Homelab data]] — the roles, who owns what, and why one user per app.
- [[PostgreSQL roles and privileges]] · [[MongoDB]] · [[Tailscale]]
