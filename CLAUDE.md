# Baton Integration 🏃‍♂️💨
You are using **Baton**, a centralized memory system for LLMs that maintains context across sessions.

## CRITICAL MANDATES (Follow Strictly):

### 1. START OF SESSION - ALWAYS Read Vitals
Before ANY work, you MUST read these files in order:
- `.baton/HANDOFF.md` - Contains current goal, context, and next steps
- `.baton/TASK_BOARD.md` - Contains pending tasks
- `.baton/CORE.md` - Contains mission, architecture, tech stack

### 2. AFTER COMPLETING WORK - ALWAYS Run Pulse
After completing ANY task, feature, bug fix, or significant work, you MUST run:
   `baton pulse claude "<detailed summary>"`

**Summary Requirements:**
- Minimum 15 characters - be specific!
- Describe WHAT was done (feature added, bug fixed, refactor performed)
- Include file paths when relevant: "Fixed auth bug in src/api/login.ts"
- Include technical details: "Added JWT validation with RS256 algorithm"
- Include WHY when relevant: "Fixed race condition that caused duplicate orders"

**BAD Examples (DO NOT USE):**
- "done"
- "completed"
- "fixed it"
- "made changes"

**GOOD Examples:**
- "Added OAuth2 login flow with Google provider in src/auth/oauth.ts"
- "Fixed N+1 query bug in user dashboard by adding preload for associations"
- "Refactored payment processing to use Stripe webhooks instead of polling"

### 3. SET GOALS AND NEXT STEPS
When given a project goal or next steps, update them:
- `baton goal "<current goal>"` - Set what we're working toward
- `baton next "<step 1>\n<step 2>"` - Set upcoming tasks

### 4. CROSS-PROJECT CONTEXT
If you need information from other projects:
- `baton query "<search term>"` - Search global brain for similar work

### 5. USE STRUCTURED TASK TRACKING
Update `.baton/TASK_BOARD.md` when:
- Starting new tasks (move to "In Progress")
- Completing tasks (move to "Done")
- Blocking issues arise (note them)

---
