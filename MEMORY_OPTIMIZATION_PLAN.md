# Memory Optimization Project Plan

## Executive Summary

This document outlines a comprehensive plan for optimizing memory usage in the PermitParser system. The goal is to reduce memory footprint by 75% for large files through streaming processing, efficient data structures, and disk-based storage strategies.

## Current State Analysis

### Existing Memory Optimization Features

The PermitParser already implements several memory optimization techniques:

1. **Streaming File Processing** (`src/parser/PermitParser.ts`)
   - Uses `fs.createReadStream()` with 64KB buffer
   - Line-by-line processing without loading entire file into memory
   - Efficient chunk processing with line buffer management

2. **StreamingPermitStorage Class** (`src/parser/PermitParser.ts`)
   - In-memory permit buffer with configurable size (default: 1000 permits)
   - Automatic flushing of oldest permits to disk when buffer is full (50% flush)
   - Peak memory tracking for monitoring
   - Lazy loading of permits from disk when needed
   - Cleanup of temp directory after parsing

3. **Checkpoint/Resume System**
   - Periodic checkpoint saves during parsing
   - Ability to resume from checkpoint on failure
   - Reduces re-processing and memory overhead on restart

4. **Performance Monitoring**
   - `PerformanceMonitor` class tracks memory usage
   - Integration tests verify memory stays within limits (< 100MB for medium files)

### Memory Usage Patterns

**Permit Data Structure** (`src/models/Permit.ts`):
- Each permit contains multiple record types (daroot, dapermit, dafield[], etc.)
- Array-based collections for child records (leases, surveys, remarks, etc.)
- GIS surface/bottomhole coordinates
- Average permit size: ~2-5KB depending on complexity

**Current Bottlenecks**:
1. All permits are returned in `ParseResult` at end of parsing
2. Checkpoint saves all permits to disk synchronously
3. No compression for disk-based permit storage
4. String-based record storage is memory-intensive

## Optimization Goals

### Primary Goals

| Goal | Target | Measurement |
|------|--------|-------------|
| Peak Memory Reduction | 75% | `peakMemoryPermits` metric |
| Large File Support | 10M+ lines | Successful parse without OOM |
| Memory per 1000 Permits | < 50MB | Heap usage monitoring |
| Parse Time Overhead | < 10% | Compared to non-streaming |

### Success Criteria

1. **Memory Efficiency**: Parse 100,000 permits using < 100MB peak memory
2. **Scalability**: Handle files up to 1GB without memory issues
3. **Performance**: Streaming overhead < 10% vs in-memory parsing
4. **Reliability**: 99.9% success rate on resume after failure

## Implementation Phases

### Phase 1: Enhanced Streaming Storage (Week 1-2)

**Tasks**:
1. Implement permit compression before disk storage
   - Use zlib or lz4 for JSON compression
   - Expected: 60-70% size reduction

2. Add memory-mapped file support for large permit sets
   - Use Node.js `fs` with streaming read/write
   - Implement lazy loading with caching

3. Optimize buffer management
   - Tune `memoryBufferSize` based on available system memory
   - Implement adaptive buffer sizing

**Deliverables**:
- `CompressedPermitStorage` class
- Memory-mapped file utilities
- Buffer size auto-tuning

### Phase 2: Data Structure Optimization (Week 3-4)

**Tasks**:
1. Implement flyweight pattern for common strings
   - County codes, operator names, well types
   - Expected: 30-40% string memory reduction

2. Use typed arrays for numeric data
   - GIS coordinates as Float32Array
   - Date stamps as Int32Array

3. Implement record pooling
   - Reuse record objects instead of creating new ones
   - Reduce GC pressure

**Deliverables**:
- `StringPool` class for interning
- Typed array wrappers for GIS data
- Object pool implementation

### Phase 3: Output Streaming (Week 5-6)

**Tasks**:
1. Implement streaming output writers
   - JSON stream writer instead of building full object
   - CSV stream writer for tabular output
   - Database batch insert streaming

2. Add async iterator support for permits
   - `for await (const permit of parser.parseStream())`
   - Process permits as they're completed

3. Implement result pagination
   - Don't return all permits in memory
   - Provide iterator/cursor-based access

**Deliverables**:
- `StreamingOutputWriter` interface
- Async iterator implementation
- Paginated result API

### Phase 4: Memory Monitoring & Tuning (Week 7-8)

**Tasks**:
1. Add real-time memory profiling
   - Track memory by permit type
   - Identify memory hotspots

2. Implement automatic memory tuning
   - Adjust buffer sizes based on heap usage
   - Trigger GC before critical thresholds

3. Create memory optimization guide
   - Document best practices
   - Provide configuration recommendations

**Deliverables**:
- Memory profiler utility
- Auto-tuning configuration
- Documentation and guides

## Technical Implementation Details

### 1. Compressed Permit Storage

```typescript
class CompressedPermitStorage extends StreamingPermitStorage {
  private compress(data: PermitData): Buffer {
    return zlib.deflateSync(JSON.stringify(data));
  }
  
  private decompress(buffer: Buffer): PermitData {
    return JSON.parse(zlib.inflateSync(buffer).toString());
  }
}
```

### 2. String Interning

```typescript
class StringPool {
  private pool = new Map<string, string>();
  
  intern(value: string): string {
    if (!this.pool.has(value)) {
      this.pool.set(value, value);
    }
    return this.pool.get(value)!;
  }
}
```

### 3. Streaming Output

```typescript
async function* parseStream(inputPath: string): AsyncGenerator<PermitData> {
  const parser = new PermitParser(config, { streamingMode: true });
  
  for await (const permit of parser.parseIterator(inputPath)) {
    yield permit;
  }
}
```

## Testing Strategy

### Unit Tests
- Memory usage per permit type
- Compression/decompression accuracy
- String pool correctness

### Integration Tests
- Large file parsing (1M+ lines)
- Memory limit compliance
- Checkpoint/resume with streaming

### Performance Benchmarks
- Baseline: Current implementation
- Target: 75% memory reduction
- Metrics: heapUsed, peakMemoryPermits, parse time

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Compression overhead | Medium | Use fast algorithms (lz4), make optional |
| Complexity increase | Medium | Maintain backward compatibility |
| Disk I/O bottleneck | Low | Use SSD, async operations |
| Data corruption | High | Checksums, validation on load |

## Related Beads

- `ubuntu-92u`: PermitParser Memory Optimization Master Plan
- `ubuntu-k7j`: Improve memory usage in PermitParser
- `ubuntu-kki.17`: Performance Optimization - Perceived & Actual

## Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Enhanced Streaming | 2 weeks | Week 1 | Week 2 |
| Phase 2: Data Structure Optimization | 2 weeks | Week 3 | Week 4 |
| Phase 3: Output Streaming | 2 weeks | Week 5 | Week 6 |
| Phase 4: Monitoring & Tuning | 2 weeks | Week 7 | Week 8 |
| **Total** | **8 weeks** | | |

## Success Metrics Dashboard

Track these metrics throughout implementation:

1. **Memory Efficiency**: `peakMemoryPermits / totalPermits`
2. **Parse Performance**: `linesPerSecond`
3. **Disk Usage**: `tempDirSize / inputFileSize`
4. **Success Rate**: `successfulParses / totalAttempts`

## Conclusion

This plan provides a roadmap for achieving 75% memory reduction in PermitParser while maintaining performance and reliability. The phased approach allows for incremental delivery and risk mitigation.

**Next Steps**:
1. Review and approve plan
2. Create child beads for each phase
3. Begin Phase 1 implementation
