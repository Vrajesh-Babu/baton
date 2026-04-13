# Baton Integration

You are using Baton, a centralized memory system for LLMs across multiple projects.

## Mandates
1. **Always Sync:** After completing any significant task, run `baton pulse gemini "<summary>"`.
2. **Read Vitals:** Start every session by reading `.baton/HANDOFF.md` and `.baton/TASK_BOARD.md`.
3. **Cross-Project Knowledge:** Run `baton query "<term>"` if you need help from previous projects.

## CLI Usage
- `baton init`: Initialize Baton in a new repository.
- `baton pulse gemini "Task complete"`: Sync current progress.
- `baton query "search term"`: Search all registered projects.
- `baton status`: View project health.
- `baton hooks`: Install git hooks for automated syncing.
