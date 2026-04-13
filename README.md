# Baton 🏃‍♂️💨

**Baton** is a lightweight, centralized memory system for developers who switch between multiple LLM coding assistants (Gemini, Claude, Cursor).

It ensures that when you pass the "baton" from one LLM to the next, the context remains unbroken.

```text
    LLM A (Gemini)          LLM B (Claude)
       [======]                [======]
          \\                      //
           \\      (BATON)       //
            \\      ====>       //
             \\                //
              [________________]
                Global Brain
```

---

## 🚀 How it Works

1.  **Global Brain (SQLite):** A central database (`~/.baton/brain.db`) tracks your work across all projects.
2.  **Local Vitals (.baton/):** Markdown files in your repo that assistants read and write.
3.  **The Pulse:** A single command to sync your current state.
---

## 🛠 Installation

To install **Baton** globally on your system:

```bash
# 1. Clone the repository
git clone https://github.com/Vrajesh-Babu/baton.git
cd baton

# 2. Install dependencies & Build
npm install
npm run build

# 3. Link the CLI globally
npm link
```

*Note: After running `npm link`, you can use the `baton` command from any terminal. This links the local build to your global path.*

---
*Note: After running `npm link`, you can use the `baton` command from any terminal.*

---

## 📖 Usage

### 1. Initialize
```bash
baton init
```

### 2. The Pulse (The Handoff)
When an LLM finishes a task, it runs:
```bash
baton pulse <llm_id> "<summary>"
```
*Example:* `baton pulse gemini "Built the UI for the login page"`

### 3. Cross-Project Search
```bash
baton query "JWT auth"
```

### 4. Auto-Sync
```bash
baton hooks
```

---

## 🤖 LLM Integration (Crucial Step!)

To make an LLM assistant (like Gemini CLI, Claude Code, or Cursor) aware that it should use **Baton**, you need to provide it with instructions. 

### For Gemini CLI or Claude Code:
Create a file named `GEMINI.md` or `CLAUDE.md` in your project root and paste this:

```markdown
# Baton Integration 🏃‍♂️💨
You are using **Baton**, a centralized memory system for LLMs.

## Your Mandates:
1. **Sync After Tasks:** After completing a significant task or at the end of your session, you MUST run:
   `baton pulse <llm_id> "<summary of what you did>"`
   *(Replace <llm_id> with your name, e.g., gemini or claude)*
2. **Read Vitals:** At the start of every session, read `.baton/HANDOFF.md` to understand the current state.
3. **Check Tasks:** Read `.baton/TASK_BOARD.md` to see what's next.
4. **Use Global Brain:** If you need context from other projects, run `baton query "<term>"`.
```

### For Cursor:
Add the instructions above to your `.cursorrules` file.

---

## 📂 The Memory Schema (`.baton/`)

- `CORE.md`: Mission & Architecture.
- `TASK_BOARD.md`: Current Kanban status.
- `HANDOFF.md`: **Crucial context for the next session.**
- `LOG.md`: Human-readable pulse history.

---

## 📜 License
MIT
