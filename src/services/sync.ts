import { BrainService } from './brain.js';
import { VitalsService } from './vitals.js';
import { GitUtils } from '../utils/git.js';

interface HandoffSections {
  currentGoal: string;
  context: string;
  nextSteps: string;
  updates: string;
}

const MAX_CONTEXT_UPDATES = 5; // Keep only last N updates in HANDOFF.md
const MIN_SUMMARY_LENGTH = 15; // Require meaningful summaries

export class SyncService {
  private brain: BrainService;
  private vitals: VitalsService;

  constructor(projectRoot: string) {
    this.brain = BrainService.getInstance();
    this.vitals = new VitalsService(projectRoot);
  }

  /**
   * Parse HANDOFF.md into structured sections
   * Handles both properly formatted and legacy content
   */
  private parseHandoff(content: string): HandoffSections {
    const sections: HandoffSections = {
      currentGoal: '',
      context: '',
      nextSteps: '',
      updates: ''
    };

    const lines = content.split('\n');
    let currentSection: keyof HandoffSections | null = null;
    const sectionContent: Partial<Record<keyof HandoffSections, string[]>> = {
      currentGoal: [],
      context: [],
      nextSteps: [],
      updates: []
    };

    for (const line of lines) {
      if (line.startsWith('## Current Goal')) {
        currentSection = 'currentGoal';
      } else if (line.startsWith('## Context')) {
        currentSection = 'context';
      } else if (line.startsWith('## Next Steps')) {
        currentSection = 'nextSteps';
      } else if (line.startsWith('### Update from')) {
        // Updates always go to context section, not a separate updates section
        currentSection = 'context';
        if (sectionContent.context) {
          sectionContent.context.push(line);
        }
      } else if (currentSection && line.trim() !== '') {
        if (sectionContent[currentSection]) {
          sectionContent[currentSection]!.push(line);
        }
      }
    }

    // Join lines back together, filtering out empty/placeholder content
    const placeholderPatterns = ['_No .* set_', '_No .* accumulated yet_', '_No .* defined_'];

    for (const [key, value] of Object.entries(sectionContent)) {
      if (value && value.length > 0) {
        const joined = value.join('\n').trim();
        // Check if it's just a placeholder
        const isPlaceholder = placeholderPatterns.some(p => new RegExp(p).test(joined));
        if (!isPlaceholder) {
          sections[key as keyof HandoffSections] = joined;
        }
      }
    }

    return sections;
  }

  /**
   * Rebuild HANDOFF.md with structured content
   */
  private rebuildHandoff(sections: HandoffSections): string {
    let output = '# Session Handoff\n\n';
    output += '## Current Goal\n\n';

    if (sections.currentGoal) {
      output += sections.currentGoal + '\n\n';
    } else {
      output += '_No current goal set_\n\n';
    }

    output += '## Context\n\n';

    if (sections.context) {
      output += sections.context + '\n\n';
    } else {
      output += '_No context accumulated yet_\n\n';
    }

    output += '## Next Steps\n\n';

    if (sections.nextSteps) {
      output += sections.nextSteps + '\n\n';
    } else {
      output += '_No next steps defined_\n\n';
    }

    return output;
  }

  /**
   * Validate summary content quality
   */
  private validateSummary(summary: string): { valid: boolean; reason?: string } {
    if (summary.length < MIN_SUMMARY_LENGTH) {
      return { valid: false, reason: `Summary too short (min ${MIN_SUMMARY_LENGTH} chars)` };
    }

    // Check for generic/unhelpful patterns
    const genericPatterns = [
      /^done$/i,
      /^completed$/i,
      /^finished$/i,
      /^ok$/i,
      /^fixed it$/i,
      /^(just|simply|merely) \w+/i
    ];

    for (const pattern of genericPatterns) {
      if (pattern.test(summary.trim())) {
        return { valid: false, reason: 'Summary too generic - be more specific' };
      }
    }

    return { valid: true };
  }

  /**
   * Trim updates to keep only the most recent ones
   */
  private trimUpdates(updates: string, maxKeep: number = MAX_CONTEXT_UPDATES): string {
    const lines = updates.split('\n');
    const updateBlocks: string[] = [];
    let currentBlock: string[] = [];

    for (const line of lines) {
      if (line.startsWith('### Update from')) {
        if (currentBlock.length > 0) {
          updateBlocks.push(currentBlock.join('\n'));
        }
        currentBlock = [line];
      } else {
        currentBlock.push(line);
      }
    }

    if (currentBlock.length > 0) {
      updateBlocks.push(currentBlock.join('\n'));
    }

    // Keep only the most recent blocks
    const kept = updateBlocks.slice(-maxKeep);
    const archived = updateBlocks.slice(0, -maxKeep);

    // Archive old updates to LOG.md
    if (archived.length > 0) {
      const archiveEntry = `\n### ${new Date().toISOString()} - Archived Updates\n${archived.join('\n\n')}\n`;
      this.vitals.appendLog(archiveEntry);
    }

    return kept.join('\n\n');
  }

  public async pulse(llmId: string, summary: string) {
    // Validate summary
    const validation = this.validateSummary(summary);
    if (!validation.valid) {
      throw new Error(`Invalid summary: ${validation.reason}`);
    }

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

    // Save to Local Vitals - Log
    const timestamp = new Date().toISOString();
    const logEntry = `### ${timestamp}\n**Summary:** ${summary}\n**LLM:** ${llmId}\n**Commits:**\n${commits}\n`;
    this.vitals.appendLog(logEntry);

    // Update Handoff with proper structure
    const currentHandoff = this.vitals.readFile('HANDOFF.md');
    const sections = this.parseHandoff(currentHandoff);

    // Add new update to Context section
    const newUpdate = `### Update from ${llmId} (${timestamp})\n${summary}\n`;
    sections.context = sections.context
      ? `${sections.context}\n\n${newUpdate}`
      : newUpdate;

    // Trim old updates from context if needed
    if (sections.context) {
      sections.context = this.trimUpdates(sections.context, MAX_CONTEXT_UPDATES);
    }

    // Update file
    const updatedHandoff = this.rebuildHandoff(sections);
    this.vitals.updateFile('HANDOFF.md', updatedHandoff);

    return {
      success: true,
      archived: sections.context.includes('### Update from')
    };
  }

  public setGoal(goal: string) {
    const currentHandoff = this.vitals.readFile('HANDOFF.md');
    const sections = this.parseHandoff(currentHandoff);
    sections.currentGoal = goal;
    this.vitals.updateFile('HANDOFF.md', this.rebuildHandoff(sections));
  }

  public setNextSteps(steps: string) {
    const currentHandoff = this.vitals.readFile('HANDOFF.md');
    const sections = this.parseHandoff(currentHandoff);
    sections.nextSteps = steps;
    this.vitals.updateFile('HANDOFF.md', this.rebuildHandoff(sections));
  }

  public getGlobalSummary(query?: string): string {
    if (query) {
      const results = this.brain.queryGlobalHistory(query);
      return results.map((r: any) => `[${r.project_name}] ${r.summary}`).join('\n');
    }
    return 'No global context requested.';
  }
}
