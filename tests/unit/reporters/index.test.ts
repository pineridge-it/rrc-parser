import * as reporters from '../../reporters';

describe('Reporters Index', () => {
  it('should export all reporter utilities', () => {
    expect(reporters.DetailedReporter).toBeDefined();
    expect(reporters.CoverageReporter).toBeDefined();
    expect(reporters.HistoricalComparison).toBeDefined();
  });
});