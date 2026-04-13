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
    const timestamp = new Date().toISOString();
    fs.appendFileSync(filePath, `\n### ${timestamp}\n${entry}\n`);
  }

  public createLLMConfigs(llms: string[]) {
    const instructions = (name: string) => `# Baton Integration 🏃‍♂️💨
You are using **Baton**, a centralized memory system for LLMs.

## Your Mandates:
1. **Sync After Tasks:** After completing a significant task or at the end of your session, you MUST run:
   \`baton pulse ${name.toLowerCase()} "<summary of what you did>"\`
2. **Read Vitals:** At the start of every session, read \`.baton/HANDOFF.md\` to understand the current state.
3. **Check Tasks:** Read \`.baton/TASK_BOARD.md\` to see what's next.
4. **Use Global Brain:** If you need context from other projects, run \`baton query "<term>"\`.
`;

    if (llms.includes('gemini')) {
      fs.writeFileSync(path.join(this.projectRoot, 'GEMINI.md'), instructions('gemini'));
    }
    if (llms.includes('claude')) {
      fs.writeFileSync(path.join(this.projectRoot, 'CLAUDE.md'), instructions('claude'));
    }
    if (llms.includes('cursor')) {
      fs.writeFileSync(path.join(this.projectRoot, '.cursorrules'), instructions('cursor'));
    }
    if (llms.includes('windsurf')) {
      fs.writeFileSync(path.join(this.projectRoot, '.windsurfrules'), instructions('windsurf'));
    }
    if (llms.includes('cline')) {
      fs.writeFileSync(path.join(this.projectRoot, '.clinerules'), instructions('cline'));
    }
    if (llms.includes('codex')) {
      fs.writeFileSync(path.join(this.projectRoot, 'CODEX.md'), instructions('codex'));
    }
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
