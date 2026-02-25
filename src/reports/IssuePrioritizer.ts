import { ValidationIssue } from '../validators/ValidationReport';

export type IssuePriority = 1 | 2 | 3;
export type IssueCategory = 'blocking' | 'data_quality' | 'format' | 'lookup';

export interface PrioritizedIssue {
  issue: ValidationIssue;
  priority: IssuePriority;
  reason: string;
  impact: string;
  autoFixable: boolean;
  fixCommand?: string;
  category: IssueCategory;
}

export interface IssueGroup {
  category: IssueCategory;
  priority: IssuePriority;
  title: string;
  count: number;
  issues: PrioritizedIssue[];
  commonFix?: string;
}

const BLOCKING_RULES = new Set([
  'required_field', 'missing_required', 'duplicate_permit', 'duplicate',
  'missing_lease_name', 'missing_operator', 'missing_permit_number',
]);

const BLOCKING_FIELDS = new Set([
  'lease_name', 'operator_number', 'permit_number', 'api_number',
  'county_code', 'district', 'operator_name',
]);

const LOOKUP_RULES = new Set([
  'county_code', 'app_type', 'well_type', 'flag', 'district',
  'lookup', 'lookup_table', 'lookup_validation',
]);

const FORMAT_RULES = new Set([
  'date_format', 'number_format', 'string_format', 'format',
  'length', 'pattern', 'regex',
]);

function deriveCategory(issue: ValidationIssue): IssueCategory {
  const ruleL = issue.rule.toLowerCase();
  const fieldL = issue.field.toLowerCase();
  if (LOOKUP_RULES.has(ruleL) || ruleL.includes('lookup')) return 'lookup';
  if (FORMAT_RULES.has(ruleL) || ruleL.includes('format') || ruleL.includes('pattern')) return 'format';
  if (
    BLOCKING_RULES.has(ruleL) || BLOCKING_FIELDS.has(fieldL) ||
    ruleL.includes('required') || ruleL.includes('missing') || ruleL.includes('duplicate')
  ) return 'blocking';
  return 'data_quality';
}

function derivePriority(issue: ValidationIssue, category: IssueCategory): IssuePriority {
  if (issue.severity === 'error') {
    return (category === 'blocking' || category === 'lookup') ? 1 : 2;
  }
  return category === 'format' ? 3 : 2;
}

function deriveImpact(issue: ValidationIssue, category: IssueCategory): string {
  switch (category) {
    case 'blocking':
      return `The ${issue.field} issue may cause this permit to be skipped during processing`;
    case 'lookup':
      return `Value "${issue.value}" isn't in the lookup table — field will be treated as unknown`;
    case 'format':
      return 'Incorrect format may cause downstream parsing or display issues';
    default:
      return 'Data quality issue may affect reporting accuracy';
  }
}

function deriveReason(priority: IssuePriority): string {
  if (priority === 1) return 'Blocks correct processing or search indexing';
  if (priority === 2) return 'Degrades data quality or downstream reliability';
  return 'Minor formatting or optional field issue';
}

function deriveFixCommand(issue: ValidationIssue, category: IssueCategory): string | undefined {
  if (category === 'blocking' && issue.rule.toLowerCase().includes('duplicate')) return '--deduplicate';
  if (category === 'lookup') return `--lookup-fallback=${issue.field}`;
  return undefined;
}

export class IssuePrioritizer {
  prioritize(issues: ValidationIssue[]): PrioritizedIssue[] {
    return issues.map(issue => {
      const category = deriveCategory(issue);
      const priority = derivePriority(issue, category);
      return {
        issue,
        priority,
        category,
        reason: deriveReason(priority),
        impact: deriveImpact(issue, category),
        autoFixable: deriveFixCommand(issue, category) !== undefined,
        fixCommand: deriveFixCommand(issue, category),
      };
    });
  }

  groupByCategory(prioritized: PrioritizedIssue[]): IssueGroup[] {
    const buckets = new Map<IssueCategory, PrioritizedIssue[]>();
    for (const p of prioritized) {
      const list = buckets.get(p.category) ?? [];
      list.push(p);
      buckets.set(p.category, list);
    }

    const meta: Record<IssueCategory, { title: string; priority: IssuePriority; commonFix?: string }> = {
      blocking:     { title: 'Blocking Issues',   priority: 1, commonFix: 'Review source data for missing required fields or duplicates' },
      lookup:       { title: 'Lookup Mismatches', priority: 1, commonFix: 'Update lookup tables or correct source codes' },
      data_quality: { title: 'Data Quality',      priority: 2, commonFix: 'Validate source data against schema definitions' },
      format:       { title: 'Format Issues',     priority: 3, commonFix: 'Normalize date/number formats before import' },
    };

    const groups: IssueGroup[] = [];
    for (const [cat, issues] of buckets.entries()) {
      const m = meta[cat];
      groups.push({ category: cat, priority: m.priority, title: m.title, count: issues.length, issues, commonFix: m.commonFix });
    }
    return groups.sort((a, b) => a.priority - b.priority);
  }
}
