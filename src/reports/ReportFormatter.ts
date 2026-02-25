import { ValidationReport } from '../validators/ValidationReport';
import { IssuePrioritizer, IssueGroup } from './IssuePrioritizer';
import { TrendAnalyzer, TrendResult } from './TrendAnalyzer';

const R = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  green:  '\x1b[32m',
  cyan:   '\x1b[36m',
  white:  '\x1b[37m',
};

function isTTY(): boolean { return process.stdout.isTTY === true; }
function c(code: string, text: string): string { return isTTY() ? `${code}${text}${R.reset}` : text; }

const W = 80;

function box(title: string, char = '═'): string {
  const top = `╔${char.repeat(W - 2)}╗`;
  const mid = `║  ${title.padEnd(W - 4)}║`;
  const bot = `╚${char.repeat(W - 2)}╝`;
  return [top, mid, bot].join('\n');
}

function divider(char = '─'): string { return char.repeat(W); }

function trendLine(trend: TrendResult): string {
  if (!trend.previous) return c(R.dim, `📊 First run — no comparison available`);
  const icon = trend.improved ? '📈' : trend.regressed ? '📉' : '➡️ ';
  const col  = trend.improved ? R.green : trend.regressed ? R.red : R.dim;
  return c(col, `${icon} Trend: ${trend.summary}`);
}

function priorityLabel(p: 1 | 2 | 3): string {
  if (p === 1) return c(R.bold + R.red,    '🚨 PRIORITY 1');
  if (p === 2) return c(R.bold + R.yellow, '⚠️  PRIORITY 2');
  return              c(R.bold + R.cyan,   '💡 PRIORITY 3');
}

function renderGroup(group: IssueGroup, maxIssues = 5): string[] {
  const lines: string[] = [];
  lines.push('');
  lines.push(`${priorityLabel(group.priority)}: ${group.title} (${group.count} issue${group.count !== 1 ? 's' : ''})`);
  lines.push(c(R.dim, '┌' + '─'.repeat(W - 2) + '┐'));

  const shown = group.issues.slice(0, maxIssues);
  for (const [idx, p] of shown.entries()) {
    const num    = c(R.bold, `${idx + 1}.`);
    const field  = c(R.cyan, p.issue.field);
    const val    = p.issue.value ? ` "${p.issue.value}"` : '';
    const permit = p.issue.permitNumber ? ` [permit ${p.issue.permitNumber}]` : '';
    lines.push(`│ ${num} ${field}${val}${permit}`);
    lines.push(c(R.dim, `│    → ${p.impact}`));
    if (p.autoFixable && p.fixCommand) {
      lines.push(c(R.green, `│    → Fix: run with ${p.fixCommand}`));
    }
  }

  if (group.issues.length > maxIssues) {
    lines.push(c(R.dim, `│  … and ${group.issues.length - maxIssues} more`));
  }

  if (group.commonFix) {
    lines.push(c(R.dim, '│'));
    lines.push(c(R.dim, `│  Common fix: ${group.commonFix}`));
  }

  lines.push(c(R.dim, '└' + '─'.repeat(W - 2) + '┘'));
  return lines;
}

export interface ReportOptions {
  maxIssuesPerGroup?: number;
  csvPath?: string;
  showQuickActions?: boolean;
}

export class ReportFormatter {
  private prioritizer = new IssuePrioritizer();
  private trendAnalyzer = new TrendAnalyzer();

  format(report: ValidationReport, opts: ReportOptions = {}): string {
    const summary  = report.getSummary();
    const issues   = report.getIssues();
    const previous = this.trendAnalyzer.loadPrevious();
    const trend    = this.trendAnalyzer.compare(summary, previous);
    const prioritized = this.prioritizer.prioritize(issues);
    const groups   = this.prioritizer.groupByCategory(prioritized);

    const lines: string[] = [];

    lines.push('');
    lines.push(c(R.bold, box('🔍 Validation Report Summary')));
    lines.push('');
    lines.push(c(R.bold, `📊 Overview: ${summary.total} issue${summary.total !== 1 ? 's' : ''} found`) +
      ` (${c(R.red, `${summary.totalErrors} error${summary.totalErrors !== 1 ? 's' : ''}`)}, ` +
      `${c(R.yellow, `${summary.totalWarnings} warning${summary.totalWarnings !== 1 ? 's' : ''}`)})`);
    lines.push(trendLine(trend));
    lines.push('');
    lines.push(divider());

    const maxPerGroup = opts.maxIssuesPerGroup ?? 5;
    for (const group of groups) {
      lines.push(...renderGroup(group, maxPerGroup));
    }

    lines.push('');
    lines.push(divider());

    // Quick actions
    const autoFixable = prioritized.filter(p => p.autoFixable);
    if (autoFixable.length > 0) {
      lines.push('');
      lines.push(c(R.bold + R.green, '💻 Quick Actions:'));
      const cmds = [...new Set(autoFixable.map(p => p.fixCommand).filter(Boolean))];
      for (const cmd of cmds) {
        lines.push(`   node dist/cli/index.js parse <file> ${cmd}`);
      }
    }

    if (opts.csvPath) {
      lines.push('');
      lines.push(c(R.dim, `📊 Full report: ${opts.csvPath}`));
    }

    lines.push('');

    // Save snapshot for next run
    this.trendAnalyzer.save(trend.current);

    return lines.join('\n');
  }

  print(report: ValidationReport, opts: ReportOptions = {}): void {
    process.stdout.write(this.format(report, opts));
  }
}
