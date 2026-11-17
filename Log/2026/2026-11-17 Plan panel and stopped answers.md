---
type: log
date: 2026-11-17
projects: ["[[Homelab UI]]", "[[Agent runtime]]"]
tags: [log, agents, css]
---

# 2026-11-17 Plan panel and stopped answers

## What we did
- **Plan panel cut off**: in the Assistant's column (flex, vertical), the plan panel had `overflow: hidden` and could shrink, so a long conversation squeezed it to its header and pushed "Approve and run" off screen. `flex-shrink: 0` on the panel and the error line. Measured at 1440×800: 14 px of 96 px before, 96 of 96 after.
- **Cancelled answer showed "answered"**: cancelling and the answer arriving both went through `settle`, which turns anything still working into answered. `settle(node, end)` now takes `answered` or `stopped`: on a cancel (AbortError) or a stream error, working agents, running tools and the current plan step become `stopped`; agents that had already finished keep their state. On a real answer the current step is marked done.
- Progress cards: a "Stopped" header with a stop square, the stopped step and tool with the same mark, and a "stopped" chip on the agent.
- Checks: 193 tests, build, prettier; seen in the browser on desktop and at 375 px.
- **agent-runtime**: when a delegation is cancelled (the supervisor's turn stops), `A2aPeerAgents` sends `CancelTask` for the peer's task (its id read from the stream), within 5 s, then lets the cancellation go on. Tested against a real uvicorn server in the test: the peer's turn is cancelled; without the change the test times out. 619 tests, ruff, ty.

## What I learned
- A flex item whose `overflow` is not `visible` gets `min-height: 0`, so it shrinks before a sibling whose content sets its minimum. Anything that must stay whole in a scrolling column needs `flex-shrink: 0`.
- a2a-sdk keeps running a task in the background when the streaming client disconnects. Cancelling the supervisor stops the supervisor, but the agents it asked finish their task anyway unless they get `tasks/cancel`.
- `httpx.ASGITransport` returns a response only once the app has finished, so it can't test a stream that is cut in the middle; a uvicorn server on port 0 inside the test can.
- `tasks/cancel` stops the run only on the replica that has it in memory; another replica only marks the task cancelled in the shared store.

## Next
- [x] agent-runtime: send `tasks/cancel` to each peer when a delegation is cancelled.
- [ ] Commit, release and deploy homelab-ui and agent-runtime.
