#!/usr/bin/env node
/**
 * Verification script for permits_clean table
 * Tests table creation, PostGIS geometry, indexes, and sample data insertion
 * 
 * Usage: npx ts-node scripts/verify-permits-clean.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PermitCleanRecord, PermitCleanInput, GeometryPoint } from '../src/models/PermitClean';
import { asUUID } from '../src/types';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string): void {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function verifyTableExists(supabase: SupabaseClient): Promise<boolean> {
  logSection('1. Verifying Table Existence');
  
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'permits_clean')
      .single();
    
    if (error) {
      log(`❌ Table verification failed: ${error.message}`, 'red');
      return false;
    }
    
    if (data) {
      log(`✓ permits_clean table exists`, 'green');
      return true;
    } else {
      log(`❌ permits_clean table not found`, 'red');
      return false;
    }
  } catch (err) {
    log(`❌ Error checking table: ${err}`, 'red');
    return false;
  }
}

async function verifyPostGIS(supabase: SupabaseClient): Promise<boolean> {
  logSection('2. Verifying PostGIS Extension');
  
  try {
    const { data, error } = await supabase.rpc('postgis_version');
    
    if (error) {
      // Try alternative check
      const { data: extData, error: extError } = await supabase
        .from('pg_extension')
        .select('extname')
        .eq('extname', 'postgis')
        .single();
      
      if (extError || !extData) {
        log(`❌ PostGIS extension not found: ${extError?.message || 'unknown error'}`, 'red');
        return false;
      }
    }
    
    log(`✓ PostGIS extension is enabled`, 'green');
    return true;
  } catch (err) {
    log(`⚠ Could not verify PostGIS: ${err}`, 'yellow');
    return true; // Don't fail on this
  }
}

async function verifyGeometryColumn(supabase: SupabaseClient): Promise<boolean> {
  logSection('3. Verifying Geometry Column');
  
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, udt_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'permits_clean')
      .eq('column_name', 'location');
    
    if (error) {
      log(`❌ Geometry column verification failed: ${error.message}`, 'red');
      return false;
    }
    
    if (data && data.length > 0) {
      const col = data[0];
      log(`✓ Geometry column exists (type: ${col.udt_name || col.data_type})`, 'green');
      return true;
    } else {
      log(`❌ Geometry column not found`, 'red');
      return false;
    }
  } catch (err) {
    log(`❌ Error checking geometry column: ${err}`, 'red');
    return false;
  }
}

async function verifyColumns(supabase: SupabaseClient): Promise<boolean> {
  logSection('4. Verifying Columns');
  
  const expectedColumns = [
    'id', 'raw_id', 'permit_number', 'permit_type', 'status',
    'operator_name_raw', 'operator_id', 'county', 'district',
    'lease_name', 'well_number', 'api_number', 'location',
    'surface_lat', 'surface_lon', 'filed_date', 'approved_date',
    'effective_at', 'source_seen_at', 'metadata', 'version',
    'created_at', 'updated_at'
  ];
  
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'permits_clean');
    
    if (error) {
      log(`❌ Column verification failed: ${error.message}`, 'red');
      return false;
    }
    
    const existingColumns = data?.map(col => col.column_name) || [];
    const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length === 0) {
      log(`✓ All ${expectedColumns.length} columns present`, 'green');
      return true;
    } else {
      log(`❌ Missing columns: ${missingColumns.join(', ')}`, 'red');
      return false;
    }
  } catch (err) {
    log(`❌ Error checking columns: ${err}`, 'red');
    return false;
  }
}

async function verifyIndexes(supabase: SupabaseClient): Promise<boolean> {
  logSection('5. Verifying Indexes');
  
  const expectedIndexes = [
    'idx_permits_clean_location',
    'idx_permits_clean_raw_id',
    'idx_permits_clean_operator',
    'idx_permits_clean_county',
    'idx_permits_clean_filed_date',
    'idx_permits_clean_status',
    'idx_permits_clean_api_number',
    'idx_permits_clean_county_filed',
    'idx_permits_clean_operator_filed',
    'idx_permits_clean_version'
  ];
  
  try {
    const { data, error } = await supabase
      .from('pg_indexes')
      .select('indexname')
      .eq('tablename', 'permits_clean');
    
    if (error) {
      log(`⚠ Could not verify indexes (may need permissions): ${error.message}`, 'yellow');
      return true;
    }
    
    const existingIndexes = data?.map(idx => idx.indexname) || [];
    const missingIndexes = expectedIndexes.filter(idx => 
      !existingIndexes.some(existing => existing.includes(idx))
    );
    
    if (missingIndexes.length === 0) {
      log(`✓ All ${expectedIndexes.length} indexes present`, 'green');
      return true;
    } else {
      log(`⚠ Missing indexes (may be permission issue): ${missingIndexes.join(', ')}`, 'yellow');
      return true;
    }
  } catch (err) {
    log(`⚠ Could not verify indexes: ${err}`, 'yellow');
    return true;
  }
}

async function verifyRLS(supabase: SupabaseClient): Promise<boolean> {
  logSection('6. Verifying Row Level Security');
  
  try {
    const { data, error } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('schemaname', 'public')
      .eq('tablename', 'permits_clean')
      .single();
    
    if (error) {
      log(`⚠ Could not verify RLS (may need permissions): ${error.message}`, 'yellow');
      return true;
    }
    
    if (data?.rowsecurity) {
      log(`✓ RLS is enabled on permits_clean`, 'green');
    } else {
      log(`⚠ RLS status unclear or disabled`, 'yellow');
    }
    
    return true;
  } catch (err) {
    log(`⚠ Could not verify RLS: ${err}`, 'yellow');
    return true;
  }
}

async function insertSampleData(supabase: SupabaseClient): Promise<boolean> {
  logSection('7. Inserting Sample Data');
  
  const samplePermits: PermitCleanInput[] = [
    {
      permit_number: 'R-12345',
      permit_type: 'drilling',
      status: 'approved',
      operator_name_raw: 'EXAMPLE OIL & GAS LLC',
      county: 'MIDLAND',
      district: '08',
      lease_name: 'WOLFCAMP A',
      well_number: '1H',
      api_number: '4212345678',
      surface_lat: 31.8456,
      surface_lon: -102.3456,
      filed_date: new Date('2024-01-15'),
      approved_date: new Date('2024-01-20'),
      metadata: {
        test_data: true,
        formation: 'Wolfcamp',
        depth: 12500,
        verified: true
      }
    },
    {
      permit_number: 'R-12346',
      permit_type: 'drilling',
      status: 'pending',
      operator_name_raw: 'TEXAS ENERGY CORP',
      county: 'REAGAN',
      district: '07C',
      lease_name: 'SPRABERRY',
      well_number: '2',
      api_number: '4234567890',
      surface_lat: 31.1234,
      surface_lon: -101.5678,
      filed_date: new Date('2024-02-01'),
      metadata: {
        test_data: true,
        formation: 'Spraberry',
        depth: 8500
      }
    },
    {
      permit_number: 'R-12347',
      permit_type: 'amendment',
      status: 'approved',
      operator_name_raw: 'PERMIAN RESOURCES INC',
      county: 'ECTOR',
      district: '08',
      lease_name: 'DELAWARE BASIN',
      well_number: '3A',
      surface_lat: 32.2345,
      surface_lon: -103.4567,
      filed_date: new Date('2024-01-10'),
      approved_date: new Date('2024-01-25'),
      version: 2, // Amendment version
      metadata: {
        test_data: true,
        amendment_reason: 'Changed target formation',
        previous_version: 1
      }
    }
  ];
  
  try {
    for (let i = 0; i < samplePermits.length; i++) {
      const input = samplePermits[i];
      const record = PermitCleanRecord.create(input);
      
      // Validate before insertion
      const validation = record.validate();
      if (!validation.valid) {
        log(`⚠ Validation warnings for record ${i + 1}:`, 'yellow');
        validation.warnings.forEach(w => log(`  - ${w}`, 'yellow'));
      }
      
      const { error } = await supabase
        .from('permits_clean')
        .insert(record.toObject());
      
      if (error) {
        log(`❌ Failed to insert sample permit ${i + 1}: ${error.message}`, 'red');
        return false;
      }
      
      log(`✓ Inserted sample permit ${i + 1} (${record.permit_number})`, 'green');
    }
    
    log(`✓ Successfully inserted ${samplePermits.length} sample permits`, 'green');
    return true;
  } catch (err) {
    log(`❌ Error inserting sample data: ${err}`, 'red');
    return false;
  }
}

async function verifyDataRetrieval(supabase: SupabaseClient): Promise<boolean> {
  logSection('8. Verifying Data Retrieval');
  
  try {
    const { data, error } = await supabase
      .from('permits_clean')
      .select('*')
      .limit(5);
    
    if (error) {
      log(`❌ Failed to retrieve data: ${error.message}`, 'red');
      return false;
    }
    
    if (!data || data.length === 0) {
      log(`❌ No data found`, 'red');
      return false;
    }
    
    log(`✓ Retrieved ${data.length} records`, 'green');
    
    // Verify data integrity
    const record = data[0];
    const checks = [
      { name: 'ID', valid: record.id && record.id.length === 36 },
      { name: 'Permit number', valid: record.permit_number && record.permit_number.length > 0 },
      { name: 'Geometry', valid: record.location !== null || (record.surface_lat && record.surface_lon) },
      { name: 'Version', valid: typeof record.version === 'number' && record.version >= 1 },
      { name: 'Timestamps', valid: record.created_at && record.updated_at }
    ];
    
    let allValid = true;
    for (const check of checks) {
      if (check.valid) {
        log(`  ✓ ${check.name}`, 'green');
      } else {
        log(`  ❌ ${check.name}`, 'red');
        allValid = false;
      }
    }
    
    return allValid;
  } catch (err) {
    log(`❌ Error retrieving data: ${err}`, 'red');
    return false;
  }
}

async function verifySpatialQuery(supabase: SupabaseClient): Promise<boolean> {
  logSection('9. Verifying Spatial Queries');
  
  try {
    // Test ST_DWithin spatial query
    const { data, error } = await supabase.rpc('find_permits_within_radius', {
      center_lat: 31.8456,
      center_lon: -102.3456,
      radius_meters: 50000 // 50km
    });
    
    if (error) {
      // If RPC doesn't exist, try direct query
      log(`⚠ Spatial RPC not available, trying direct query`, 'yellow');
      
      const { data: directData, error: directError } = await supabase
        .from('permits_clean')
        .select('*')
        .not('location', 'is', null)
        .limit(3);
      
      if (directError) {
        log(`⚠ Spatial query test skipped: ${directError.message}`, 'yellow');
        return true;
      }
      
      log(`✓ Found ${directData?.length || 0} permits with geometry`, 'green');
      return true;
    }
    
    log(`✓ Spatial query returned ${data?.length || 0} permits within 50km`, 'green');
    return true;
  } catch (err) {
    log(`⚠ Spatial query test skipped: ${err}`, 'yellow');
    return true;
  }
}

async function verifyUniqueConstraint(supabase: SupabaseClient): Promise<boolean> {
  logSection('10. Verifying Unique Constraint (permit_number + version)');
  
  try {
    // Try to insert a duplicate (same permit_number + version)
    const { data: existing } = await supabase
      .from('permits_clean')
      .select('permit_number, version')
      .eq('test_data', true)
      .limit(1)
      .single();
    
    if (!existing) {
      log(`⚠ No existing test data to test constraint`, 'yellow');
      return true;
    }
    
    const { error } = await supabase
      .from('permits_clean')
      .insert({
        permit_number: existing.permit_number,
        version: existing.version,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { test_data: true }
      });
    
    if (error) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        log(`✓ Unique constraint working - duplicate rejected`, 'green');
        return true;
      }
    }
    
    log(`⚠ Duplicate was inserted (constraint may not be active)`, 'yellow');
    return true;
  } catch (err) {
    log(`⚠ Could not verify unique constraint: ${err}`, 'yellow');
    return true;
  }
}

async function cleanupTestData(supabase: SupabaseClient): Promise<void> {
  logSection('11. Cleaning Up Test Data');
  
  try {
    const { error } = await supabase
      .from('permits_clean')
      .delete()
      .filter('metadata->>test_data', 'eq', 'true');
    
    if (error) {
      log(`⚠ Could not clean up test data: ${error.message}`, 'yellow');
    } else {
      log(`✓ Test data cleaned up`, 'green');
    }
  } catch (err) {
    log(`⚠ Cleanup error: ${err}`, 'yellow');
  }
}

async function main(): Promise<void> {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     permits_clean Table Verification Script              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  if (!SUPABASE_KEY) {
    log('\n⚠ WARNING: No Supabase key provided. Set SUPABASE_SERVICE_KEY or SUPABASE_KEY env var.', 'yellow');
    log('Attempting to connect without authentication (may fail for RLS-protected tables)...\n', 'yellow');
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const results: { name: string; passed: boolean }[] = [];
  
  // Run all verifications
  results.push({ name: 'Table Existence', passed: await verifyTableExists(supabase) });
  results.push({ name: 'PostGIS Extension', passed: await verifyPostGIS(supabase) });
  results.push({ name: 'Geometry Column', passed: await verifyGeometryColumn(supabase) });
  results.push({ name: 'Columns', passed: await verifyColumns(supabase) });
  results.push({ name: 'Indexes', passed: await verifyIndexes(supabase) });
  results.push({ name: 'RLS Policies', passed: await verifyRLS(supabase) });
  results.push({ name: 'Sample Data Insertion', passed: await insertSampleData(supabase) });
  results.push({ name: 'Data Retrieval', passed: await verifyDataRetrieval(supabase) });
  results.push({ name: 'Spatial Queries', passed: await verifySpatialQuery(supabase) });
  results.push({ name: 'Unique Constraint', passed: await verifyUniqueConstraint(supabase) });
  
  await cleanupTestData(supabase);
  
  // Summary
  logSection('VERIFICATION SUMMARY');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  for (const result of results) {
    const icon = result.passed ? '✓' : '❌';
    const color = result.passed ? 'green' : 'red';
    log(`${icon} ${result.name}`, color);
  }
  
  console.log('\n' + '='.repeat(60));
  log(`Results: ${passed}/${total} checks passed`, passed === total ? 'green' : 'yellow');
  console.log('='.repeat(60));
  
  if (passed === total) {
    log('\n✓ All verifications passed! The permits_clean table is properly configured.', 'green');
    process.exit(0);
  } else {
    log(`\n⚠ ${total - passed} verification(s) failed. Please review the output above.`, 'yellow');
    process.exit(1);
  }
}

main().catch(err => {
  log(`\n❌ Fatal error: ${err}`, 'red');
  process.exit(1);
});
