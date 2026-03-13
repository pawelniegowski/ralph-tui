/**
 * ABOUTME: Markdown tracker plugin for task files in a directory.
 * Each task is a separate .md file with YAML frontmatter for machine-readable flags
 * and markdown sections for plans. Files live in a ./tasks/ directory by default.
 */

import { readFile, writeFile, readdir, access, constants } from 'node:fs/promises';
import { resolve, basename, join } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { BaseTrackerPlugin } from '../../base.js';
import { MARKDOWN_TEMPLATE } from '../../../../templates/builtin.js';
import type {
  TrackerPluginMeta,
  TrackerPluginFactory,
  TrackerTask,
  TrackerTaskStatus,
  TaskPriority,
  TaskFilter,
  TaskCompletionResult,
  SetupQuestion,
} from '../../types.js';

/**
 * Parsed frontmatter from a markdown task file.
 */
interface TaskFrontmatter {
  id: string;
  passes: boolean;
  priority: number;
  model: string;
}

/**
 * Parsed markdown task file.
 */
interface ParsedTaskFile {
  frontmatter: TaskFrontmatter;
  title: string;
  description: string;
  implementationPlan: string;
  testingPlan: string;
  /** The full markdown body (everything after frontmatter) */
  body: string;
  /** The file path */
  filePath: string;
}

const IMPLEMENTATION_PLAN_RE = /^##\s+implementation\s+plan\s*$/im;
const TESTING_PLAN_RE = /^##\s+testing\s+plan\s*$/im;

/**
 * Default frontmatter values.
 */
const FRONTMATTER_DEFAULTS: Omit<TaskFrontmatter, 'id'> = {
  passes: false,
  priority: 5,
  model: 'opus',
};

/**
 * Parse a markdown task file into structured data.
 */
function parseTaskFile(content: string, filePath: string): ParsedTaskFile {
  const fileName = basename(filePath, '.md');

  // Split on frontmatter markers
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);

  let rawFrontmatter: Record<string, unknown> = {};
  let body: string;

  if (fmMatch) {
    rawFrontmatter = parseYaml(fmMatch[1]!) ?? {};
    body = fmMatch[2]!;
  } else {
    body = content;
  }

  // Build frontmatter with defaults
  const frontmatter: TaskFrontmatter = {
    id: typeof rawFrontmatter.id === 'string' ? rawFrontmatter.id : fileName,
    passes: typeof rawFrontmatter.passes === 'boolean' ? rawFrontmatter.passes : FRONTMATTER_DEFAULTS.passes,
    priority: typeof rawFrontmatter.priority === 'number' ? rawFrontmatter.priority : FRONTMATTER_DEFAULTS.priority,
    model: typeof rawFrontmatter.model === 'string' ? rawFrontmatter.model : FRONTMATTER_DEFAULTS.model,
  };

  // Extract title from first H1
  const titleMatch = body.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1]!.trim() : fileName;

  // Extract description: content between H1 and first ##
  let description = '';
  if (titleMatch) {
    const afterTitle = body.slice(titleMatch.index! + titleMatch[0].length);
    const nextH2 = afterTitle.search(/^##\s+/m);
    description = (nextH2 >= 0 ? afterTitle.slice(0, nextH2) : afterTitle).trim();
  }

  // Extract implementation plan
  const implementationPlan = extractSection(body, IMPLEMENTATION_PLAN_RE);

  // Extract testing plan
  const testingPlan = extractSection(body, TESTING_PLAN_RE);

  return { frontmatter, title, description, implementationPlan, testingPlan, body, filePath };
}

/**
 * Extract content under a ## heading until the next ## or EOF.
 */
function extractSection(body: string, headingRe: RegExp): string {
  const match = body.match(headingRe);
  if (!match || match.index === undefined) return '';

  const afterHeading = body.slice(match.index + match[0].length);
  const nextH2 = afterHeading.search(/^##\s+/m);
  const content = (nextH2 >= 0 ? afterHeading.slice(0, nextH2) : afterHeading).trim();
  return content;
}

/**
 * Serialize frontmatter + body back to markdown.
 */
function serializeTaskFile(frontmatter: TaskFrontmatter, body: string): string {
  const yamlStr = stringifyYaml(frontmatter).trim();
  return `---\n${yamlStr}\n---\n${body}`;
}

/**
 * Rewrite a file's frontmatter while preserving the body exactly.
 */
function rewriteFrontmatter(content: string, newFrontmatter: TaskFrontmatter): string {
  const fmMatch = content.match(/^---\s*\n[\s\S]*?\n---\s*\n([\s\S]*)$/);
  const body = fmMatch ? fmMatch[1]! : content;
  return serializeTaskFile(newFrontmatter, body);
}

/**
 * Check if frontmatter has all required fields with correct types.
 */
function frontmatterNeedsDefaults(raw: Record<string, unknown>): boolean {
  return (
    typeof raw.id !== 'string' ||
    typeof raw.passes !== 'boolean' ||
    typeof raw.priority !== 'number' ||
    typeof raw.model !== 'string'
  );
}

/**
 * Convert frontmatter priority (1-based) to TaskPriority (0-4).
 */
function mapPriority(fmPriority: number): TaskPriority {
  const clamped = Math.max(0, Math.min(4, fmPriority - 1));
  return clamped as TaskPriority;
}

/**
 * Determine task status based on passes flag and plan sections.
 */
function determineStatus(parsed: ParsedTaskFile): TrackerTaskStatus {
  if (parsed.frontmatter.passes) return 'completed';

  // BLOCKED if implementation plan or testing plan is missing/empty
  const implEmpty = !parsed.implementationPlan || !parsed.implementationPlan.trim();
  const testEmpty = !parsed.testingPlan || !parsed.testingPlan.trim();
  if (implEmpty || testEmpty) return 'blocked';

  return 'open';
}

/**
 * Convert a parsed task file to TrackerTask.
 */
function parsedToTask(parsed: ParsedTaskFile): TrackerTask {
  return {
    id: parsed.frontmatter.id,
    title: parsed.title,
    status: determineStatus(parsed),
    priority: mapPriority(parsed.frontmatter.priority),
    description: parsed.description,
    type: 'story',
    model: parsed.frontmatter.model,
    metadata: {
      filePath: parsed.filePath,
      implementationPlan: parsed.implementationPlan,
      testingPlan: parsed.testingPlan,
    },
  };
}

/**
 * Markdown tracker plugin implementation.
 * Reads task files from a directory (default: ./tasks/).
 */
export class MarkdownTrackerPlugin extends BaseTrackerPlugin {
  readonly meta: TrackerPluginMeta = {
    id: 'markdown',
    name: 'Markdown File Tracker',
    description: 'Track tasks as individual markdown files in a directory',
    version: '1.0.0',
    supportsBidirectionalSync: false,
    supportsHierarchy: false,
    supportsDependencies: false,
  };

  private dirPath: string = '';
  /** Write lock to prevent interleaved read-modify-write operations */
  private writeLock: Promise<void> = Promise.resolve();

  override async initialize(config: Record<string, unknown>): Promise<void> {
    await super.initialize(config);

    const path = typeof config.path === 'string' ? config.path : './tasks/';
    this.dirPath = resolve(path);

    try {
      await access(this.dirPath, constants.R_OK);
      this.ready = true;
    } catch {
      this.ready = false;
    }
  }

  override async isReady(): Promise<boolean> {
    if (!this.dirPath) return false;

    try {
      await access(this.dirPath, constants.R_OK);
      this.ready = true;
      return true;
    } catch {
      this.ready = false;
      return false;
    }
  }

  getSetupQuestions(): SetupQuestion[] {
    return [];
  }

  /**
   * Read and parse all .md files in the tasks directory.
   */
  private async readAllTasks(): Promise<ParsedTaskFile[]> {
    const entries = await readdir(this.dirPath);
    const mdFiles = entries.filter((e) => e.endsWith('.md')).sort();

    const tasks: ParsedTaskFile[] = [];

    for (const file of mdFiles) {
      const filePath = join(this.dirPath, file);
      try {
        const content = await readFile(filePath, 'utf-8');
        const parsed = parseTaskFile(content, filePath);

        // Ensure defaults are written if missing
        const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
        if (fmMatch) {
          const rawFm = parseYaml(fmMatch[1]!) ?? {};
          if (frontmatterNeedsDefaults(rawFm)) {
            const updated = rewriteFrontmatter(content, parsed.frontmatter);
            await writeFile(filePath, updated, 'utf-8');
          }
        } else {
          // No frontmatter at all - write defaults
          const updated = serializeTaskFile(parsed.frontmatter, content);
          await writeFile(filePath, updated, 'utf-8');
        }

        tasks.push(parsed);
      } catch {
        // Skip unparseable files
      }
    }

    return tasks;
  }

  /**
   * Read and parse a single task file by ID.
   */
  private async readTaskById(id: string): Promise<{ parsed: ParsedTaskFile; rawContent: string } | undefined> {
    const entries = await readdir(this.dirPath);
    const mdFiles = entries.filter((e) => e.endsWith('.md'));

    for (const file of mdFiles) {
      const filePath = join(this.dirPath, file);
      const content = await readFile(filePath, 'utf-8');
      const parsed = parseTaskFile(content, filePath);
      if (parsed.frontmatter.id === id) {
        return { parsed, rawContent: content };
      }
    }

    return undefined;
  }

  async getTasks(filter?: TaskFilter): Promise<TrackerTask[]> {
    if (!this.dirPath) return [];

    try {
      const parsed = await this.readAllTasks();
      const tasks = parsed.map(parsedToTask);
      return this.filterTasks(tasks, filter);
    } catch (err) {
      console.error('Failed to read markdown tasks:', err);
      return [];
    }
  }

  override async getNextTask(filter?: TaskFilter): Promise<TrackerTask | undefined> {
    const tasks = await this.getTasks({
      ...filter,
      status: 'open',
      ready: true,
    });

    if (tasks.length === 0) return undefined;

    tasks.sort((a, b) => a.priority - b.priority);
    return tasks[0];
  }

  /**
   * Execute a function while holding the write lock.
   */
  private async withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
    const previousLock = this.writeLock;
    let releaseLock: () => void;
    this.writeLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    try {
      await previousLock;
      return await fn();
    } finally {
      releaseLock!();
    }
  }

  async completeTask(id: string, reason?: string): Promise<TaskCompletionResult> {
    return this.withWriteLock(async () => {
      try {
        const result = await this.readTaskById(id);
        if (!result) {
          return { success: false, message: `Task ${id} not found`, error: 'Task not found' };
        }

        const { parsed, rawContent } = result;
        parsed.frontmatter.passes = true;
        const updated = rewriteFrontmatter(rawContent, parsed.frontmatter);
        await writeFile(parsed.filePath, updated, 'utf-8');

        return {
          success: true,
          message: `Task ${id} marked as complete${reason ? `: ${reason}` : ''}`,
          task: parsedToTask({ ...parsed, frontmatter: { ...parsed.frontmatter, passes: true } }),
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, message: `Failed to complete task ${id}`, error: message };
      }
    });
  }

  async updateTaskStatus(id: string, status: TrackerTaskStatus): Promise<TrackerTask | undefined> {
    return this.withWriteLock(async () => {
      try {
        const result = await this.readTaskById(id);
        if (!result) return undefined;

        const { parsed, rawContent } = result;
        parsed.frontmatter.passes = status === 'completed' || status === 'cancelled';
        const updated = rewriteFrontmatter(rawContent, parsed.frontmatter);
        await writeFile(parsed.filePath, updated, 'utf-8');

        return parsedToTask({ ...parsed, frontmatter: { ...parsed.frontmatter } });
      } catch {
        return undefined;
      }
    });
  }

  override getTemplate(): string {
    return MARKDOWN_TEMPLATE;
  }

  async getPrdContext(): Promise<{
    name: string;
    description?: string;
    content: string;
    completedCount: number;
    totalCount: number;
  } | null> {
    if (!this.dirPath) return null;

    try {
      const parsed = await this.readAllTasks();
      if (parsed.length === 0) return null;

      // Combine all task bodies as context
      const content = parsed
        .map((p) => p.body.trim())
        .filter(Boolean)
        .join('\n\n---\n\n');

      return {
        name: 'Task Files',
        content,
        completedCount: parsed.filter((p) => p.frontmatter.passes).length,
        totalCount: parsed.length,
      };
    } catch {
      return null;
    }
  }

  getStateFiles(): string[] {
    if (!this.dirPath) return [];

    // Return the directory itself; individual files are the state
    try {
      // We can't do sync readdir here, so return the dir path
      // The engine should treat this as "all files in this dir"
      return [this.dirPath];
    } catch {
      return [];
    }
  }

  override async getEpics(): Promise<TrackerTask[]> {
    if (!this.dirPath) return [];

    try {
      const parsed = await this.readAllTasks();

      return parsed.map((p) => ({
        id: `md:${p.frontmatter.id}`,
        title: p.title,
        status: determineStatus(p),
        priority: mapPriority(p.frontmatter.priority),
        description: p.description,
        type: 'epic' as const,
        metadata: {
          filePath: p.filePath,
        },
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get the directory path.
   */
  getDirPath(): string {
    return this.dirPath;
  }
}

/**
 * Factory function for the Markdown tracker plugin.
 */
const createMarkdownTracker: TrackerPluginFactory = () => new MarkdownTrackerPlugin();

export default createMarkdownTracker;
