# Baton Integration 🏃‍♂️💨
You are using **Baton**, a centralized memory system for LLMs.

## Your Mandates:
1. **Sync After Tasks:** After completing a significant task or at the end of your session, you MUST run:
   `baton pulse codex "<summary of what you did>"`
2. **Read Vitals:** At the start of every session, read `.baton/HANDOFF.md` to understand the current state.
3. **Check Tasks:** Read `.baton/TASK_BOARD.md` to see what's next.
4. **Use Global Brain:** If you need context from other projects, run `baton query "<term>"`.
