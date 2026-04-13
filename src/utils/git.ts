import { execSync } from 'child_process';

export class GitUtils {
  public static getDiff(): string {
    try {
      return execSync('git diff HEAD', { encoding: 'utf-8' });
    } catch (e) {
      return '';
    }
  }

  public static getRecentCommits(limit = 5): string {
    try {
      return execSync(`git log -n ${limit} --pretty=format:"%h - %s (%an)"`, { encoding: 'utf-8' });
    } catch (e) {
      return '';
    }
  }

  public static getProjectRoot(): string {
    try {
      return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
    } catch (e) {
      return process.cwd();
    }
  }

  public static getProjectName(): string {
    const root = this.getProjectRoot();
    const parts = root.split('/');
    return parts[parts.length - 1] || 'Unknown Project';
  }
}
