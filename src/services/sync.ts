import { BrainService } from './brain.js';
import { VitalsService } from './vitals.js';
import { GitUtils } from '../utils/git.js';

export class SyncService {
  private brain: BrainService;
  private vitals: VitalsService;

  constructor(projectRoot: string) {
    this.brain = BrainService.getInstance();
    this.vitals = new VitalsService(projectRoot);
  }

  public async pulse(llmId: string, summary: string) {
    const projectRoot = GitUtils.getProjectRoot();
    const projectName = GitUtils.getProjectName();

    const projectId = this.brain.registerProject({
      name: projectName,
      path: projectRoot
    });

    const diff = GitUtils.getDiff();
    const commits = GitUtils.getRecentCommits(3);

    // Save to Global Brain
    this.brain.addEvent({
      project_id: projectId,
      llm_id: llmId,
      summary: summary,
      diff_snapshot: diff
    });

    // Save to Local Vitals
    const logEntry = `**Summary:** ${summary}\n**Commits:**\n${commits}\n`;
    this.vitals.appendLog(logEntry);

    // Update Handoff
    const currentHandoff = this.vitals.readFile('HANDOFF.md');
    // Simple update - in a real scenario, this would be more sophisticated
    const updatedHandoff = `${currentHandoff}\n\n### Update from ${llmId}\n${summary}\n`;
    this.vitals.updateFile('HANDOFF.md', updatedHandoff);
  }

  public getGlobalSummary(query?: string): string {
    if (query) {
      const results = this.brain.queryGlobalHistory(query);
      return results.map((r: any) => `[${r.project_name}] ${r.summary}`).join('\n');
    }
    return 'No global context requested.';
  }
}
