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
    const sync = new SyncService(GitUtils.getProjectRoot());
    await sync.pulse(llmId, summary);
    console.log(chalk.blue('⚡ Pulse synchronized! Brain updated. 🧠✨'));
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
      console.log(chalk.cyan(`Global Brain Context for "${text}":`));
      results.forEach((r: any) => {
        console.log(`- [${chalk.bold(r.project_name)}] (${r.timestamp}) ${r.summary}`);
      });
    }
  });

program
  .command('status')
  .description('Show the current project status and handoff info')
  .action(() => {
    const root = GitUtils.getProjectRoot();
    const vitals = new VitalsService(root);
    
    console.log(chalk.bold('Project:'), GitUtils.getProjectName());
    console.log(chalk.bold('Handoff:'));
    console.log(vitals.readFile('HANDOFF.md'));
  });

program
  .command('hooks')
  .description('Install git hooks for automated syncing')
  .action(() => {
    const root = GitUtils.getProjectRoot();
    const hookPath = path.join(root, '.git', 'hooks', 'post-commit');
    const hookContent = `#!/bin/sh\nbaton pulse git "Git Commit: $(git log -1 --pretty=%B)"\n`;
    
    if (!fs.existsSync(path.dirname(hookPath))) {
      console.log(chalk.red('Error: Not a git repository or .git folder not found.'));
      return;
    }
    
    fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
    console.log(chalk.green('✔ Git post-commit hook installed successfully! ⚓'));
  });

export default program;
