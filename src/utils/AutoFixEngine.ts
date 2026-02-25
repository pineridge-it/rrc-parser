import { UserError } from './UserError';

export interface FixResult {
  code: string;
  description: string;
  applied: boolean;
  error?: string;
}

export interface FixableIssue {
  code: string;
  description: string;
  apply: () => void;
}

export class AutoFixEngine {
  private issues: FixableIssue[] = [];

  register(issue: FixableIssue): void {
    this.issues.push(issue);
  }

  registerFromErrors(errors: UserError[]): void {
    for (const err of errors) {
      if (err.isFixable()) {
        this.issues.push({
          code: err.code,
          description: err.autoFix!.description,
          apply: err.autoFix!.apply,
        });
      }
    }
  }

  hasFixableIssues(): boolean {
    return this.issues.length > 0;
  }

  count(): number {
    return this.issues.length;
  }

  applyAll(): FixResult[] {
    const results: FixResult[] = [];
    for (const issue of this.issues) {
      try {
        issue.apply();
        results.push({ code: issue.code, description: issue.description, applied: true });
      } catch (err) {
        results.push({
          code: issue.code,
          description: issue.description,
          applied: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return results;
  }

  applySingle(code: string): FixResult | null {
    const issue = this.issues.find(i => i.code === code);
    if (!issue) return null;
    try {
      issue.apply();
      return { code: issue.code, description: issue.description, applied: true };
    } catch (err) {
      return {
        code: issue.code,
        description: issue.description,
        applied: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  getSummary(): string {
    if (this.issues.length === 0) return 'No auto-fixable issues found.';
    const lines = [
      `⚠️  Found ${this.issues.length} fixable issue${this.issues.length > 1 ? 's' : ''}:`,
    ];
    for (const [i, issue] of this.issues.entries()) {
      lines.push(`   ${i + 1}. ${issue.description}`);
    }
    lines.push('\nRun with --fix to auto-correct these issues.');
    return lines.join('\n');
  }

  static normalizeEncoding(raw: string): string {
    const map: Record<string, string> = {
      'utf-8': 'utf8',
      'UTF-8': 'utf8',
      'UTF8':  'utf8',
      'LATIN1': 'latin1',
      'LATIN-1': 'latin1',
      'ASCII': 'ascii',
    };
    return map[raw] ?? raw;
  }

  static buildEncodingFix(
    settingsObj: { encoding?: string },
    rawValue: string
  ): FixableIssue {
    const normalized = AutoFixEngine.normalizeEncoding(rawValue);
    return {
      code: 'CFG-004',
      description: `Change encoding "${rawValue}" → "${normalized}"`,
      apply: () => { settingsObj.encoding = normalized; },
    };
  }
}
