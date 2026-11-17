---
type: log
date: 2026-11-17
projects: ["[[Homelab UI]]"]
tags: [log, ui, accessibility]
---

# 2026-11-17 Agent details window

## What we did
- An agent card in the Assistant's answer was too narrow to read: plan steps wrapped word by word beside their tool, tool errors were cut to one line. Showed a mockup first, then built it once approved.
- Each card now has a ⤢ button next to its fold arrow. It opens a window over the conversation (a sheet from the bottom on a phone) with the whole task, every plan step with its tool under it, and every tool call with its arguments or error wrapped in full, plus how many failed. It updates live, and agents it asked open their own window on top.
- The card head became three buttons (fold, details, chevron) instead of one big button, since a button can't hold another. The state chip takes its colour from its own class, so it looks the same in the card and the window; "needs input" is now amber.
- Checks: 214 tests (3 new for the window), build, desktop and phone captures.
- **agent-runtime**: a failed tool call's error now comes whole in its `progress` event, line breaks kept, capped at 4,000 characters (`ERROR_LIMIT`) so a runaway stack trace can't flood every frame. Arguments and tasks stay on one line of 160 characters. 621 tests, ruff, ty.

## What I learned
- The native `<dialog>` with `showModal()` gives the backdrop, Esc, focus trapping and the top layer (no clipping by `overflow: hidden` parents) for free. A click on the backdrop lands on the dialog element itself, so `event.target === event.currentTarget` means "clicked outside" when the content fills the dialog.
- jsdom has `showModal` and `close` missing, so both need a fallback (`open` attribute) for component tests.

## Next
- [x] agent-runtime sends a tool's error whole (up to 4,000 characters).
- [ ] Commit, release and deploy homelab-ui and agent-runtime.
