import { UserError, ErrorCategory } from './UserError';

const ANSI = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  yellow:  '\x1b[33m',
  green:   '\x1b[32m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  bgRed:   '\x1b[41m',
};

function isTTY(): boolean {
  return process.stdout.isTTY === true;
}

function c(ansiCode: string, text: string): string {
  if (!isTTY()) return text;
  return `${ansiCode}${text}${ANSI.reset}`;
}

function categoryIcon(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.CONFIGURATION: return '⚙️ ';
    case ErrorCategory.VALIDATION:    return '🔍';
    case ErrorCategory.PARSING:       return '📄';
    case ErrorCategory.PERMISSION:    return '🔒';
    case ErrorCategory.NETWORK:       return '🌐';
    default:                          return '❌';
  }
}

export interface FormatOptions {
  showStack?: boolean;
  compact?: boolean;
}

export class ErrorFormatter {
  format(err: UserError, opts: FormatOptions = {}): string {
    if (opts.compact) {
      return this.formatCompact(err);
    }
    return this.formatFull(err, opts.showStack ?? false);
  }

  private formatFull(err: UserError, showStack: boolean): string {
    const lines: string[] = [];
    const icon = categoryIcon(err.category);

    lines.push('');
    lines.push(c(ANSI.bold + ANSI.red, `${icon} ${err.title}`));
    lines.push('');
    lines.push(`  ${err.message}`);

    if (err.suggestion) {
      lines.push('');
      lines.push(c(ANSI.green, '✅ Fix it:'));
      lines.push(`  ${err.suggestion}`);
      if (err.autoFix) {
        lines.push(c(ANSI.dim, `  Or run with --fix to apply automatically: ${err.autoFix.description}`));
      }
    }

    if (err.learnMoreUrl) {
      lines.push('');
      lines.push(c(ANSI.cyan, '📚 Learn more:'));
      lines.push(`  ${err.learnMoreUrl}`);
    }

    lines.push('');
    lines.push(c(ANSI.dim, `📋 Error code: ${err.code}  |  Request ID: ${err.requestId}`));

    if (showStack && err.stack) {
      lines.push('');
      lines.push(c(ANSI.dim, 'Stack trace:'));
      lines.push(c(ANSI.dim, err.stack));
    }

    lines.push('');
    return lines.join('\n');
  }

  private formatCompact(err: UserError): string {
    let out = `${err.code}: ${err.title} — ${err.message}`;
    if (err.suggestion) {
      out += ` (fix: ${err.suggestion})`;
    }
    return out;
  }

  formatList(errors: UserError[], opts: FormatOptions = {}): string {
    if (errors.length === 0) return '';
    const lines: string[] = [];
    lines.push('');
    lines.push(c(ANSI.bold + ANSI.red, `❌ Found ${errors.length} error${errors.length > 1 ? 's' : ''}:`));
    lines.push('');

    const fixable = errors.filter(e => e.isFixable());
    if (fixable.length > 0) {
      lines.push(c(ANSI.green, `✅ ${fixable.length} issue${fixable.length > 1 ? 's' : ''} can be auto-fixed (run with --fix):`));
      for (const e of fixable) {
        lines.push(c(ANSI.dim, `  • ${e.autoFix!.description}`));
      }
      lines.push('');
    }

    for (const err of errors) {
      const idx = errors.indexOf(err) + 1;
      lines.push(c(ANSI.bold, `  ${idx}. [${err.code}] ${err.title}`));
      lines.push(`     ${err.message}`);
      if (err.suggestion) {
        lines.push(c(ANSI.green, `     → ${err.suggestion}`));
      }
      if (opts.compact === false && err.learnMoreUrl) {
        lines.push(c(ANSI.dim, `     ${err.learnMoreUrl}`));
      }
    }
    lines.push('');
    return lines.join('\n');
  }

  static fromError(err: unknown, verbose = false): string {
    const formatter = new ErrorFormatter();
    if (err instanceof UserError) {
      return formatter.format(err, { showStack: verbose });
    }
    if (err instanceof Error) {
      const lines: string[] = [
        '',
        c(ANSI.bold + ANSI.red, `❌ Error: ${err.message}`),
        '',
      ];
      if (verbose && err.stack) {
        lines.push(c(ANSI.dim, 'Stack trace:'));
        lines.push(c(ANSI.dim, err.stack));
        lines.push('');
      }
      return lines.join('\n');
    }
    return `\n${c(ANSI.red, '❌ Unknown error:')} ${String(err)}\n`;
  }
}
