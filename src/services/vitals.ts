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
}
