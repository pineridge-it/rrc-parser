import * as fs from 'fs';
import * as path from 'path';

export interface RunSnapshot {
  runAt: string;
  totalErrors: number;
  totalWarnings: number;
  total: number;
  byField: Record<string, number>;
  byRule: Record<string, number>;
}

export interface TrendResult {
  previous: RunSnapshot | null;
  current: RunSnapshot;
  deltaTotal: number;
  deltaErrors: number;
  deltaWarnings: number;
  improved: boolean;
  regressed: boolean;
  neutral: boolean;
  summary: string;
}

const HISTORY_FILE = path.join(process.cwd(), '.validation-history.json');

export class TrendAnalyzer {
  private historyFile: string;

  constructor(historyFile = HISTORY_FILE) {
    this.historyFile = historyFile;
  }

  loadPrevious(): RunSnapshot | null {
    try {
      if (!fs.existsSync(this.historyFile)) return null;
      const raw = fs.readFileSync(this.historyFile, 'utf8');
      return JSON.parse(raw) as RunSnapshot;
    } catch {
      return null;
    }
  }

  save(snapshot: RunSnapshot): void {
    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(snapshot, null, 2), 'utf8');
    } catch {
      // non-fatal — history is best-effort
    }
  }

  compare(
    current: Pick<RunSnapshot, 'totalErrors' | 'totalWarnings' | 'total' | 'byField' | 'byRule'>,
    previous: RunSnapshot | null
  ): TrendResult {
    const currentSnap: RunSnapshot = {
      runAt: new Date().toISOString(),
      ...current,
    };

    const deltaTotal    = previous ? current.total        - previous.total        : 0;
    const deltaErrors   = previous ? current.totalErrors  - previous.totalErrors  : 0;
    const deltaWarnings = previous ? current.totalWarnings - previous.totalWarnings : 0;

    const improved  = previous !== null && deltaTotal < 0;
    const regressed = previous !== null && deltaTotal > 0;
    const neutral   = previous !== null && deltaTotal === 0;

    let summary: string;
    if (!previous) {
      summary = `First run — ${current.total} issue${current.total !== 1 ? 's' : ''} found`;
    } else if (improved) {
      const reduction = Math.abs(deltaTotal);
      summary = `↓ ${reduction} fewer issue${reduction !== 1 ? 's' : ''} than last run`;
      if (deltaErrors < 0) summary += ` (errors down ${Math.abs(deltaErrors)})`;
    } else if (regressed) {
      summary = `↑ ${deltaTotal} more issue${deltaTotal !== 1 ? 's' : ''} than last run`;
      if (deltaErrors > 0) summary += ` (errors up ${deltaErrors})`;
    } else {
      summary = 'No change from last run';
    }

    return { previous, current: currentSnap, deltaTotal, deltaErrors, deltaWarnings, improved, regressed, neutral, summary };
  }
}
