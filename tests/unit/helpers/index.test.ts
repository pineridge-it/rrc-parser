import * as helpers from '../../helpers';

describe('Helpers Index', () => {
  it('should export all helper utilities', () => {
    // Logging exports
    expect(helpers.TestLogger).toBeDefined();
    expect(helpers.logger).toBeDefined();
    expect(helpers.LogEntry).toBeDefined();
    expect(helpers.LogLevel).toBeDefined();
    expect(helpers.LogPhase).toBeDefined();
    expect(helpers.LogOptions).toBeDefined();

    // Logged Operations exports
    expect(helpers.loggedOperation).toBeDefined();
    expect(helpers.loggedOperationSync).toBeDefined();
    expect(helpers.loggedQuery).toBeDefined();
    expect(helpers.loggedInsert).toBeDefined();
    expect(helpers.loggedBatchInsert).toBeDefined();
    expect(helpers.loggedFileRead).toBeDefined();
    expect(helpers.loggedFileWrite).toBeDefined();
    expect(helpers.loggedFileDelete).toBeDefined();
    expect(helpers.loggedFileExists).toBeDefined();
    expect(helpers.loggedMkdir).toBeDefined();
    expect(helpers.loggedReaddir).toBeDefined();
    expect(helpers.loggedHttpRequest).toBeDefined();
    expect(helpers.loggedHttpGet).toBeDefined();
    expect(helpers.loggedHttpPost).toBeDefined();
    expect(helpers.logPipelineStart).toBeDefined();
    expect(helpers.logPipelineComplete).toBeDefined();
    expect(helpers.logPipelineError).toBeDefined();
    expect(helpers.timeOperation).toBeDefined();
    expect(helpers.timeOperationSync).toBeDefined();
    expect(helpers.createTimer).toBeDefined();

    // New exports
    expect(helpers.PipelineLogger).toBeDefined();
    expect(helpers.LogAnalyzer).toBeDefined();
  });
});