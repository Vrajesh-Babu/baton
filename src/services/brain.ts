import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';

export interface Project {
  id?: number;
  name: string;
  path: string;
  stack?: string;
}

export interface Event {
  id?: number;
  project_id: number;
  llm_id: string;
  timestamp?: string;
  summary: string;
  diff_snapshot?: string;
}

export class BrainService {
  private db: Database.Database;
  private static instance: BrainService;

  private constructor() {
    const globalDir = path.join(os.homedir(), '.baton');
    if (!fs.existsSync(globalDir)) {
      fs.mkdirSync(globalDir, { recursive: true });
    }

    const dbPath = path.join(globalDir, 'brain.db');
    this.db = new Database(dbPath);
    this.initSchema();
  }

  public static getInstance(): BrainService {
    if (!BrainService.instance) {
      BrainService.instance = new BrainService();
    }
    return BrainService.instance;
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        stack TEXT
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        llm_id TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        summary TEXT NOT NULL,
        diff_snapshot TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );
    `);
  }

  public registerProject(project: Project): number {
    const stmt = this.db.prepare(`
      INSERT INTO projects (name, path, stack)
      VALUES (?, ?, ?)
      ON CONFLICT(path) DO UPDATE SET
        name = excluded.name,
        stack = excluded.stack
      RETURNING id
    `);
    const result = stmt.get(project.name, project.path, project.stack) as { id: number };
    return result.id;
  }

  public getProjectByPath(projectPath: string): Project | undefined {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE path = ?');
    return stmt.get(projectPath) as Project | undefined;
  }

  public addEvent(event: Event) {
    const stmt = this.db.prepare(`
      INSERT INTO events (project_id, llm_id, summary, diff_snapshot)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(event.project_id, event.llm_id, event.summary, event.diff_snapshot);
  }

  public getEvents(projectId: number, limit = 10) {
    const stmt = this.db.prepare(`
      SELECT * FROM events
      WHERE project_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(projectId, limit) as Event[];
  }

  public queryGlobalHistory(query: string, limit = 5) {
    const stmt = this.db.prepare(`
      SELECT e.*, p.name as project_name
      FROM events e
      JOIN projects p ON e.project_id = p.id
      WHERE e.summary LIKE ?
      ORDER BY e.timestamp DESC
      LIMIT ?
    `);
    return stmt.all(`%${query}%`, limit);
  }
}
