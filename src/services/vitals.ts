import fs from 'fs';
import path from 'path';

export class VitalsService {
  private projectRoot: string;
  private aiLinkDir: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.aiLinkDir = path.join(this.projectRoot, '.baton');
  }

  public ensureInitialized() {
    if (!fs.existsSync(this.aiLinkDir)) {
      fs.mkdirSync(this.aiLinkDir, { recursive: true });
    }
    
    this.ensureFile('CORE.md', '# Project Core\nMission: \nArchitecture: \nTech Stack: ');
    this.ensureFile('TASK_BOARD.md', '# Task Board\n\n## Ready\n\n## In Progress\n\n## Done\n');
    this.ensureFile('HANDOFF.md', '# Session Handoff\n\n## Current Goal\n\n## Context\n\n## Next Steps\n');
    this.ensureFile('LOG.md', '# Project Log\n\n');
  }

  private ensureFile(filename: string, defaultContent: string) {
    const filePath = path.join(this.aiLinkDir, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, defaultContent);
    }
  }

  public updateFile(filename: string, content: string) {
    const filePath = path.join(this.aiLinkDir, filename);
    fs.writeFileSync(filePath, content);
  }

  public readFile(filename: string): string {
    const filePath = path.join(this.aiLinkDir, filename);
    return fs.readFileSync(filePath, 'utf-8');
  }

  public appendLog(entry: string) {
    const filePath = path.join(this.aiLinkDir, 'LOG.md');
    fs.appendFileSync(filePath, entry);
  }

  public createLLMConfigs(llms: string[]) {
    const getInstructions = (name: string) => `# Baton Integration 🏃‍♂️💨
You are using **Baton**, a centralized memory system for LLMs that maintains context across sessions.

## CRITICAL MANDATES (Follow Strictly):

### 1. START OF SESSION - ALWAYS Read Vitals
Before ANY work, you MUST read these files in order:
- \`.baton/HANDOFF.md\` - Contains current goal, context, and next steps
- \`.baton/TASK_BOARD.md\` - Contains pending tasks
- \`.baton/CORE.md\` - Contains mission, architecture, tech stack

### 2. AFTER COMPLETING WORK - ALWAYS Run Pulse
After completing ANY task, feature, bug fix, or significant work, you MUST run:
   \`baton pulse ${name.toLowerCase()} "<detailed summary>"\`

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
- \`baton goal "<current goal>"\` - Set what we're working toward
- \`baton next "<step 1>\\n<step 2>"\` - Set upcoming tasks

### 4. CROSS-PROJECT CONTEXT
If you need information from other projects:
- \`baton query "<search term>"\` - Search global brain for similar work

### 5. USE STRUCTURED TASK TRACKING
Update \`.baton/TASK_BOARD.md\` when:
- Starting new tasks (move to "In Progress")
- Completing tasks (move to "Done")
- Blocking issues arise (note them)

---
`;

    const writeSafe = (filename: string, name: string) => {
      const filePath = path.join(this.projectRoot, filename);
      const batonHeader = '# Baton Integration 🏃‍♂️💨';
      const instructions = getInstructions(name);

      if (fs.existsSync(filePath)) {
        const existingContent = fs.readFileSync(filePath, 'utf-8');
        if (!existingContent.includes(batonHeader)) {
          fs.writeFileSync(filePath, instructions + '\n' + existingContent);
        }
      } else {
        fs.writeFileSync(filePath, instructions);
      }
    };

    if (llms.includes('gemini')) writeSafe('GEMINI.md', 'gemini');
    if (llms.includes('claude')) writeSafe('CLAUDE.md', 'claude');
    if (llms.includes('cursor')) writeSafe('.cursorrules', 'cursor');
    if (llms.includes('windsurf')) writeSafe('.windsurfrules', 'windsurf');
    if (llms.includes('cline')) writeSafe('.clinerules', 'cline');
    if (llms.includes('codex')) writeSafe('CODEX.md', 'codex');
  }

  public addToGitignore(llms: string[]) {
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    let content = '';
    if (fs.existsSync(gitignorePath)) {
      content = fs.readFileSync(gitignorePath, 'utf-8');
    }

    const toIgnore = ['.baton/'];
    if (llms.includes('gemini')) toIgnore.push('GEMINI.md');
    if (llms.includes('claude')) toIgnore.push('CLAUDE.md');
    if (llms.includes('cursor')) toIgnore.push('.cursorrules');
    if (llms.includes('windsurf')) toIgnore.push('.windsurfrules');
    if (llms.includes('cline')) toIgnore.push('.clinerules');
    if (llms.includes('codex')) toIgnore.push('CODEX.md');

    let updatedContent = content;
    if (!updatedContent.includes('# Baton')) {
      updatedContent += '\n\n# Baton\n';
    }

    toIgnore.forEach(item => {
      if (!updatedContent.includes(item)) {
        updatedContent += `${item}\n`;
      }
    });

    fs.writeFileSync(gitignorePath, updatedContent);
  }
}
