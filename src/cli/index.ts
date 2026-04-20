import { Command } from 'commander';
import { BrainService } from '../services/brain.js';
import { VitalsService } from '../services/vitals.js';
import { SyncService } from '../services/sync.js';
import { GitUtils } from '../utils/git.js';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import inquirer from 'inquirer';

const program = new Command();

program
  .name('baton')
  .description('Pass the context stick between LLMs seamlessly.')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize Baton for the current project')
  .action(async () => {
    const root = GitUtils.getProjectRoot();
    const vitals = new VitalsService(root);
    vitals.ensureInitialized();

    const brain = BrainService.getInstance();
    brain.registerProject({
      name: GitUtils.getProjectName(),
      path: root
    });

    console.log(chalk.green('✔ Baton initialized successfully! 🏃‍♂️💨'));

    const { llms } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'llms',
        message: 'Which LLMs do you use for this project?',
        choices: [
          { name: 'All', value: 'all' },
          new inquirer.Separator(),
          { name: 'Gemini CLI', value: 'gemini' },
          { name: 'Claude Code', value: 'claude' },
          { name: 'Cursor', value: 'cursor' },
          { name: 'Windsurf', value: 'windsurf' },
          { name: 'Cline', value: 'cline' },
          { name: 'Codex/Cursor Generic', value: 'codex' }
        ]
      }
    ]);

    let selectedLLMs = llms;
    if (llms.includes('all')) {
      selectedLLMs = ['gemini', 'claude', 'cursor', 'windsurf', 'cline', 'codex'];
    }

    if (selectedLLMs.length > 0) {
      vitals.createLLMConfigs(selectedLLMs);
      console.log(chalk.blue(`✔ Created instruction files for: ${selectedLLMs.join(', ')}`));

      const { ignore } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'ignore',
          message: 'Add these configuration files and the .baton folder to .gitignore?',
          default: true
        }
      ]);

      if (ignore) {
        vitals.addToGitignore(selectedLLMs);
        console.log(chalk.blue('✔ Updated .gitignore to exclude Baton files.'));
      }
    }
  });

program
  .command('pulse')
  .description('Update the project state and Global Brain')
  .argument('<llmId>', 'The ID of the current LLM (e.g., gemini, claude)')
  .argument('<summary>', 'What was accomplished in this turn')
  .action(async (llmId, summary) => {
    try {
      const sync = new SyncService(GitUtils.getProjectRoot());
      await sync.pulse(llmId, summary);
      console.log(chalk.blue('⚡ Pulse synchronized! Brain updated. 🧠✨'));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`✖ Pulse failed: ${error.message}`));
        process.exit(1);
      }
      throw error;
    }
  });

program
  .command('goal')
  .description('Set the current goal for this project')
  .argument('<goal>', 'The current goal or objective')
  .action((goal) => {
    const sync = new SyncService(GitUtils.getProjectRoot());
    sync.setGoal(goal);
    console.log(chalk.green('✔ Current goal updated! 🎯'));
  });

program
  .command('next')
  .description('Set the next steps for this project')
  .argument('<steps>', 'The next steps to take (use \\n for multiple steps)')
  .action((steps) => {
    const sync = new SyncService(GitUtils.getProjectRoot());
    const formatted = steps.replace('\\n', '\n');
    sync.setNextSteps(formatted);
    console.log(chalk.green('✔ Next steps updated! ➡️'));
  });

program
  .command('query')
  .description('Search Global Brain for context from other projects')
  .argument('<text>', 'The search term')
  .action((text) => {
    const brain = BrainService.getInstance();

    const results = brain.queryGlobalHistory(text);

    if (results.length === 0) {
      console.log(chalk.yellow('No matching context found.'));
    } else {
      console.log(chalk.cyan(`\nGlobal Brain Context for "${text}":\n`));
      results.forEach((r: any) => {
        console.log(`  ${chalk.dim('─'.repeat(50))}`);
        console.log(`  ${chalk.bold(r.project_name)} ${chalk.dim(`(${r.timestamp})`)}`);
        console.log(`  ${chalk.gray('LLM:')} ${r.llm_id}`);
        console.log(`  ${r.summary}`);
      });
      console.log('');
    }
  });

program
  .command('status')
  .description('Show the current project status and handoff info')
  .action(() => {
    const root = GitUtils.getProjectRoot();
    const vitals = new VitalsService(root);

    console.log(chalk.bold('\n📊 Project Status\n'));
    console.log(`${chalk.bold('Project:')} ${GitUtils.getProjectName()}`);
    console.log(`${chalk.bold('Path:')} ${root}\n`);

    console.log(`${chalk.bold('📋 Handoff:')}`);
    const handoff = vitals.readFile('HANDOFF.md');
    console.log(handoff);

    // Show recent brain entries
    const brain = BrainService.getInstance();
    const project = brain.getProjectByPath(root);
    if (project && project.id) {
      const events = brain.getEvents(project.id, 3);
      if (events.length > 0) {
        console.log(chalk.bold('\n🧠 Recent Brain Entries:'));
        events.forEach((e: any) => {
          console.log(`  ${chalk.dim(e.timestamp)} ${chalk.gray(`[${e.llm_id}]`)}`);
          console.log(`  ${e.summary.substring(0, 100)}${e.summary.length > 100 ? '...' : ''}\n`);
        });
      }
    }
  });

program
  .command('hooks')
  .description('Install git hooks for automated syncing')
  .action(() => {
    const root = GitUtils.getProjectRoot();
    const hookPath = path.join(root, '.git', 'hooks', 'post-commit');
    const hookContent = `#!/bin/sh
# Baton auto-sync hook
baton pulse git "Git Commit: $(git log -1 --pretty=%B)" 2>/dev/null || true
`;

    if (!fs.existsSync(path.dirname(hookPath))) {
      console.log(chalk.red('Error: Not a git repository or .git folder not found.'));
      return;
    }

    fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
    console.log(chalk.green('✔ Git post-commit hook installed successfully! ⚓'));
  });

export default program;
