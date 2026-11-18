---
type: decisions
project: "[[Kitchen Atelier]]"
tags: [kitchen-atelier, decisions]
updated: 2026-11-18
---

# Kitchen Atelier decisions

Newest first.

## 2026-11-18 — A schema inside `homelab`, not a database of its own
- **Context:** `postgres-mcp`'s `DATABASE_URI` is hard-wired to the single `homelab` database ([[Homelab data]]); a new database would be invisible to it.
- **Decision:** the ingredient catalog lives in a new `kitchen` schema inside the existing `homelab` database, owned outright by a new login role `kitchen_atelier` (`CREATE SCHEMA kitchen AUTHORIZATION kitchen_atelier`) — the same idea as Tasker's `tasker_web`, but with real `LOGIN` rights since kitchen-atelier is a backend service, not a browser talking to PostgREST.
- **Why:** it rides the existing nightly `pg_dump --dbname=homelab` backup for free, and it's reachable by `postgres-mcp` (and so the kitchen agent) without touching the shared MCP pod at all.
- **Alternatives:** a new `kitchen` database (invisible to `postgres-mcp` without reconfiguring it); reusing the shared `mcp` role (full `pg_read_all_data`/`pg_write_all_data` across every schema — far more than one service's own table needs).
- **Consequences:** a `kitchen_atelier` role and its Secret join `repository/postgres/values.yaml.gotmpl` and `scripts/secrets.sh`; the schema's migration lives in `repository/db-migrate` like every other one.

## 2026-11-18 — Recipes in their own MongoDB database, not an agent's
- **Decision:** a new `kitchen` Mongo database (not `agent_kitchen`, which is the kitchen agent's own conversation-checkpoint database) — recipes aren't a conversation, they outlive any one chat.
- **Why:** mixes badly with the agent's per-agent `agent_<name>` convention ([[Homelab data]]) if named the same way; a clean separate database makes it obvious which data is "the app's" versus "one conversation's memory".
- **Alternatives:** storing recipes as structured messages inside `agent_kitchen` (ties the data's lifetime to the agent's memory retention, and the homelab-ui page would need to parse conversation history to render a recipe card).
- **Consequences:** `mongodump` already dumps every database with no `--db` flag, so this is backed up with zero infrastructure changes; the service connects with the existing root/`mcp` Mongo credential (Secret `mongodb`) rather than a dedicated per-app account, since MongoDB here has no per-database least-privilege account mechanism yet — a gap shared with every other consumer of this MongoDB instance, not new to this project.

## 2026-11-18 — Immutable version snapshots, not a mutable recipe
- **Decision:** `SaveRecipeVersion` always appends the next version number as a full snapshot (title, ingredients, steps, macros); it never edits a stored version. Selecting an older version renders it read-only; editing always resumes from a draft of the *latest* version. A save whose `based_on_version` is no longer the latest is refused with `StaleVersion` (HTTP 409) instead of silently overwriting someone's concurrent edit.
- **Why:** real history — "what did this recipe look like before I changed the sauce" — needs more than a `+/-` counter with no persistence behind it (which is what the original mockup had).
- **Alternatives:** one mutable recipe row with an `updated_at` (loses history entirely); a full event log of every field change (more machinery than a home kitchen app needs).
- **Consequences:** an ingredient line's macros are denormalized onto the version at save time, so a later CIQUAL catalog refresh never changes an already-saved recipe's numbers; homelab-ui's `RecipeEditorStore` has to distinguish "editing the live draft" from "viewing a past version" ([[Homelab UI page - Kitchen]]).

## 2026-11-18 — `scope_kitchen` gets a curated read-only tool list, not the `mongodb_*`/`postgres_*` wildcard
- **Decision:** [[Agent toolbox]]'s `scope_kitchen` lists specific tools (`mongodb_find`, `mongodb_aggregate`, `mongodb_collection_schema`, `mongodb_collection_indexes`, `mongodb_list_collections`, `postgres_list_schemas`, `postgres_list_objects`, `postgres_get_object_details`, `postgres_execute_sql`, plus `python_executor`) instead of the broad wildcard `scope_analysis` uses.
- **Why:** the kitchen agent should be able to query kitchen data — recipes, ingredients — not every collection and schema the shared MongoDB/PostgreSQL instances happen to also hold ([[Agent toolbox decisions]], "Tools served by scope, one endpoint each").
- **Alternatives:** `mongodb_*`/`postgres_*` wildcards like `scope_analysis` (the agent could then read Tasker's workflows, other agents' conversations — anything in either instance); a brand-new MCP server scoped to just `kitchen`/`homelab.kitchen` (a pod and a connector to maintain for one agent).
- **Consequences:** a new Mongo collection or Postgres table the kitchen agent should see needs its tool added to the list by hand, same as any other scope.

## No `/mcp` tools for writing recipes
- **Decision:** `scope_kitchen`'s `postgres_execute_sql` still runs through the shared `mcp` Postgres role ([[Homelab data]]) — the same read-only-unless-the-write-switch-is-on account every other scope's SQL tool uses — and no Mongo write tool is listed; the agent *reads* recipes and ingredients but writes through the homelab-ui page like a person would.
- **Why:** a chat agent silently rewriting someone's saved recipe is a worse failure mode than it suggesting one and a person saving it.
