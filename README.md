# Nexus

My knowledge hub: every project I build, why it is built that way, and the concepts behind it — written to be learned from, not just stored. It is an [Obsidian](https://obsidian.md) vault: clone this repository and open it in any Obsidian.

## How it is organised

| Folder | What lives there |
|---|---|
| `00 Home.md` | The start page: where things are, what is in progress |
| `00 Nexus map.canvas` | Every project and how they connect, on one canvas |
| `10 Projects/` | One folder per project: its overview, a map, its repositories, its decisions |
| `20 Concepts/` | One note per idea (Kubernetes, MCP, hexagonal architecture…): what it is, how our projects use it, questions to check yourself |
| `30 Paths/` | Learning paths: concepts in the order to learn them, with practice in our own projects |
| `40 Playbooks/` | Runbooks copied from the projects (how to deploy, operate, fix) |
| `50 Journal/` | One note per work session: what we did, learned and decided |
| `80 Inbox/` | Quick notes to sort later |
| `90 Templates/` | The shape of every note type |
| `99 Assets/` | Images and attachments |

Every note starts with a small block of properties (`type`, `status`, `tags`, `updated`) and links to the notes it relates to, so Obsidian's graph and backlinks show how everything fits.

## How it is written

- **Teach, don't list.** A note says what something is, why it is that way, and how to check you understood it.
- **One idea per note**, linked rather than repeated.
- **Decisions keep their reasons and the alternatives turned down**, so the choice can be revisited later.
- **Public repository:** no secrets, passwords, tokens, internal addresses or personal data, ever.

## Open it

Clone this repository and open the folder as a vault in Obsidian; the Obsidian Git plugin, included, pulls on start and pushes every 10 minutes. Details, also without git: [00 Open the nexus](00%20Open%20the%20nexus.md).
