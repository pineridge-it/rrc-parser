import { PermitData } from '../../types/permit';
import { ILogger } from '../../types/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

export interface PermitLoadResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

export interface PermitLoaderConfig {
  batchSize?: number;
  enableVersionHistory?: boolean;
  enableChangeFeed?: boolean;
}

interface PermitRecord {
  id: string;
  permit_number: string;
  operator_id?: string;
  created_at: string;
}



export class PermitLoader {
  private logger: ILogger;
  private supabase: SupabaseClient;
  private config: PermitLoaderConfig;

  constructor(supabase: SupabaseClient, logger: ILogger, config: PermitLoaderConfig = {}) {
    this.supabase = supabase;
    this.logger = logger;
    this.config = {
      batchSize: config.batchSize ?? 100,
      enableVersionHistory: config.enableVersionHistory ?? true,
      enableChangeFeed: config.enableChangeFeed ?? true,
    };
  }

  async loadPermits(permits: PermitData[], batchSize: number = this.config.batchSize ?? 100): Promise<PermitLoadResult> {
    const result: PermitLoadResult = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      errorDetails: []
    };

    for (let i = 0; i < permits.length; i += batchSize) {
      const batch = permits.slice(i, i + batchSize);
      this.logger.info(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(permits.length/batchSize)}`);

      try {
        const batchResult = await this.loadBatch(batch);
        result.inserted += batchResult.inserted;
        result.updated += batchResult.updated;
        result.skipped += batchResult.skipped;
        result.errors += batchResult.errors;
        result.errorDetails.push(...batchResult.errorDetails);
      } catch (error) {
        this.logger.error(`Error processing batch: ${error instanceof Error ? error.message : String(error)}`);
        result.errors += batch.length;
        result.errorDetails.push(`Batch ${Math.floor(i/batchSize) + 1}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.logger.info(`Load completed - Inserted: ${result.inserted}, Updated: ${result.updated}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
    return result;
  }

  private async loadBatch(batch: PermitData[]): Promise<PermitLoadResult> {
    const result: PermitLoadResult = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      errorDetails: []
    };

    // Collect all permit numbers up front with validation
    const permitNumbers: string[] = [];
    const permitByNumber = new Map<string, PermitData>();
    for (const permit of batch) {
      const num = this.getPermitNumber(permit);
      if (num) {
        // Validate permit number format to prevent injection attacks
        // Permit numbers should be alphanumeric with hyphens only
        if (!/^[A-Z0-9\-]+$/i.test(num)) {
          result.errors++;
          result.errorDetails.push(`Invalid permit_number format: ${num.substring(0, 50)}`);
          continue;
        }
        permitNumbers.push(num);
        permitByNumber.set(num, permit);
      } else {
        result.errors++;
        result.errorDetails.push('Permit missing permit_number');
      }
    }

    if (permitNumbers.length === 0) return result;

    // Batch-fetch all existing permits in one query
    const { data: existingRows, error: fetchError } = await this.supabase
      .from('permits')
      .select('id, permit_number, operator_id, created_at')
      .in('permit_number', permitNumbers);

    if (fetchError) {
      this.logger.error(`Error batch-fetching permits: ${fetchError.message}`);
      result.errors += permitNumbers.length;
      result.errorDetails.push(`Batch fetch failed: ${fetchError.message}`);
      return result;
    }

    const existingByNumber = new Map<string, PermitRecord>(
      (existingRows ?? []).map((r: PermitRecord) => [r.permit_number, r])
    );

    // Batch-fetch the latest version hashes for existing permits
    const existingIds = Array.from(existingByNumber.values()).map(r => r.id);
    const latestHashByPermitId = new Map<string, string>();

    if (existingIds.length > 0) {
      const { data: versionRows, error: versionError } = await this.supabase
        .from('permit_versions')
        .select('permit_id, version_hash, source_seen_at')
        .in('permit_id', existingIds)
        .order('source_seen_at', { ascending: false });

      if (versionError) {
        this.logger.error(`Error batch-fetching permit versions: ${versionError.message}`);
      } else {
        for (const row of (versionRows ?? [])) {
          if (!latestHashByPermitId.has(row.permit_id)) {
            latestHashByPermitId.set(row.permit_id, row.version_hash);
          }
        }
      }
    }

    for (const permitNumber of permitNumbers) {
      const permit = permitByNumber.get(permitNumber);
      // Safety check: permit should always exist at this point
      if (!permit) {
        result.errors++;
        result.errorDetails.push(`Internal error: permit ${permitNumber} not found in batch map`);
        continue;
      }
      try {
        const versionHash = this.computeVersionHash(permit);
        const existingPermit = existingByNumber.get(permitNumber);

        if (existingPermit) {
          const latestHash = latestHashByPermitId.get(existingPermit.id);
          const changed = latestHash !== versionHash;

          if (changed) {
            await this.updatePermit(existingPermit.id, permit, versionHash);
            result.updated++;
            this.logger.debug(`Updated permit ${permitNumber}`);
          } else {
            result.skipped++;
            this.logger.debug(`Skipped unchanged permit ${permitNumber}`);
          }
        } else {
          const insertResult = await this.insertPermitWithConflictHandling(permit, versionHash);
          if (insertResult.inserted) {
            result.inserted++;
            this.logger.debug(`Inserted permit ${permitNumber}`);
          } else if (insertResult.updated) {
            result.updated++;
            this.logger.debug(`Race condition resolved - updated permit ${permitNumber}`);
          } else {
            result.skipped++;
            this.logger.debug(`Race condition resolved - skipped unchanged permit ${permitNumber}`);
          }
        }
      } catch (error) {
        result.errors++;
        const errorMsg = `Error loading permit ${permitNumber}: ${error instanceof Error ? error.message : String(error)}`;
        result.errorDetails.push(errorMsg);
        this.logger.error(errorMsg);
      }
    }

    return result;
  }

  private getPermitNumber(permit: PermitData): string | null {
    return permit.dapermit?.permit_number || permit.daroot?.permit_number || null;
  }

  private computeVersionHash(permit: PermitData): string {
    const normalized = {
      permit_number: this.getPermitNumber(permit),
      operator_name: permit.daroot?.operator_name,
      lease_name: permit.daroot?.lease_name,
      county_code: permit.daroot?.county_code,
      district: permit.daroot?.district,
      well_type: permit.dapermit?.well_type,
      application_type: permit.dapermit?.application_type,
      status: permit.daroot?.status_flag,
      issued_date: permit.dapermit?.issued_date,
      total_depth: permit.dapermit?.total_depth,
      lat: permit.gis_surface?.latitude,
      lon: permit.gis_surface?.longitude,
    };
    return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
  }

  private async findExistingPermit(permitNumber: string): Promise<PermitRecord | null> {
    const { data, error } = await this.supabase
      .from('permits')
      .select('id, permit_number, operator_id, created_at')
      .eq('permit_number', permitNumber)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding permit ${permitNumber}: ${error.message}`);
      return null;
    }
    return data;
  }

  async permitExists(permit: PermitData): Promise<boolean> {
    const permitNumber = this.getPermitNumber(permit);
    if (!permitNumber) return false;
    const existing = await this.findExistingPermit(permitNumber);
    return existing !== null;
  }

  private async hasPermitVersionChanged(permitId: string, versionHash: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('permit_versions')
      .select('id')
      .eq('permit_id', permitId)
      .eq('version_hash', versionHash)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error checking permit version: ${error.message}`);
      return true;
    }
    return data === null;
  }

  async hasPermitChanged(permit: PermitData): Promise<boolean> {
    const permitNumber = this.getPermitNumber(permit);
    if (!permitNumber) return false;

    const existingPermit = await this.findExistingPermit(permitNumber);
    if (!existingPermit) return false;

    const versionHash = this.computeVersionHash(permit);
    return this.hasPermitVersionChanged(existingPermit.id, versionHash);
  }

  private buildPermitAttributes(permit: PermitData): Record<string, unknown> {
    return {
      operator_number: permit.daroot?.operator_number,
      well_number: permit.dapermit?.well_number,
      total_depth: permit.dapermit?.total_depth,
      horizontal_flag: permit.dapermit?.horizontal_flag,
      directional_flag: permit.dapermit?.directional_flag,
      sidetrack_flag: permit.dapermit?.sidetrack_flag,
      surface_section: permit.dapermit?.surface_section,
      surface_block: permit.dapermit?.surface_block,
      surface_survey: permit.dapermit?.surface_survey,
      surface_abstract: permit.dapermit?.surface_abstract,
      fields: permit.dafield?.map(f => f.field_name).filter(Boolean),
      leases: permit.dalease?.map(l => l.lease_name).filter(Boolean),
      remarks: permit.daremarks?.map(r => r.remark).filter(Boolean),
      restrictions: permit.dacanres?.map(r => r.restriction).filter(Boolean),
    };
  }

  async insertPermit(permit: PermitData, versionHash?: string): Promise<string> {
    const permitNumber = this.getPermitNumber(permit);
    if (!permitNumber) {
      throw new Error('Cannot insert permit without permit_number');
    }

    const hash = versionHash || this.computeVersionHash(permit);
    const now = new Date().toISOString();

    const { data: permitData, error: permitError } = await this.supabase
      .from('permits')
      .insert({
        permit_number: permitNumber,
        created_at: now,
      })
      .select('id')
      .single();

    if (permitError || !permitData) {
      throw new Error(`Failed to insert permit: ${permitError?.message || 'Unknown error'}`);
    }

    const permitId = permitData.id;
    let versionId: string | null = null;

    if (this.config.enableVersionHistory) {
      const { data: versionData, error: versionError } = await this.supabase
        .from('permit_versions')
        .insert({
          permit_id: permitId,
          version_hash: hash,
          source_seen_at: now,
          effective_at: permit.dapermit?.issued_date || now,
          status: permit.daroot?.status_flag,
          permit_type: permit.dapermit?.application_type,
          county: permit.daroot?.county_code,
          filed_date: permit.dapermit?.received_date,
          attributes: this.buildPermitAttributes(permit),
        })
        .select('id')
        .single();

      if (versionError) {
        this.logger.error(`Failed to insert permit version: ${versionError.message}`);
      } else {
        versionId = versionData?.id ?? null;
      }
    }

    if (this.config.enableChangeFeed) {
      await this.createPermitChange(permitId, versionId, 'new', now);
    }

    this.logger.debug(`Inserted permit ${permitNumber} with id ${permitId}`);
    return permitId;
  }

  private async insertPermitWithConflictHandling(
    permit: PermitData,
    versionHash?: string
  ): Promise<{ inserted: boolean; updated: boolean }> {
    const permitNumber = this.getPermitNumber(permit);
    if (!permitNumber) {
      throw new Error('Cannot insert permit without permit_number');
    }

    const hash = versionHash || this.computeVersionHash(permit);
    const now = new Date().toISOString();

    // Use UPSERT with onConflict to atomically insert or return existing
    // This eliminates the race condition window between INSERT and SELECT
    const { data: permitData, error: permitError } = await this.supabase
      .from('permits')
      .upsert(
        { permit_number: permitNumber, created_at: now, updated_at: now },
        { onConflict: 'permit_number', ignoreDuplicates: false }
      )
      .select('id, created_at, updated_at')
      .single();

    if (permitError || !permitData) {
      throw new Error(`Failed to upsert permit: ${permitError?.message ?? 'no data returned'}`);
    }

    // Determine if this was an insert or update by comparing timestamps
    // If created_at === updated_at, it's a new insert
    const wasInserted = permitData.created_at === permitData.updated_at;
    const permitId = permitData.id;

    let versionId: string | null = null;

    if (this.config.enableVersionHistory) {
      const { data: versionData, error: versionError } = await this.supabase
        .from('permit_versions')
        .insert({
          permit_id: permitId,
          version_hash: hash,
          source_seen_at: now,
          effective_at: permit.dapermit?.issued_date || now,
          status: permit.daroot?.status_flag,
          permit_type: permit.dapermit?.application_type,
          county: permit.daroot?.county_code,
          filed_date: permit.dapermit?.received_date,
          attributes: this.buildPermitAttributes(permit),
        })
        .select('id')
        .single();

      if (versionError) {
        this.logger.error(`Failed to insert permit version: ${versionError.message}`);
      } else {
        versionId = versionData?.id ?? null;
      }
    }

    if (this.config.enableChangeFeed) {
      await this.createPermitChange(permitId, versionId, wasInserted ? 'new' : 'updated', now);
    }

    this.logger.debug(`Upserted permit ${permitNumber} with id ${permitId} (inserted: ${wasInserted})`);
    return { inserted: wasInserted, updated: !wasInserted };
  }

  async updatePermit(permitId: string, permit: PermitData, versionHash?: string): Promise<void> {
    const hash = versionHash || this.computeVersionHash(permit);
    const now = new Date().toISOString();
    let versionId: string | null = null;

    if (this.config.enableVersionHistory) {
      const { data: versionData, error: versionError } = await this.supabase
        .from('permit_versions')
        .insert({
          permit_id: permitId,
          version_hash: hash,
          source_seen_at: now,
          effective_at: permit.dapermit?.issued_date || now,
          status: permit.daroot?.status_flag,
          permit_type: permit.dapermit?.application_type,
          county: permit.daroot?.county_code,
          filed_date: permit.dapermit?.received_date,
          attributes: this.buildPermitAttributes(permit),
        })
        .select('id')
        .single();

      if (versionError) {
        throw new Error(`Failed to insert new permit version: ${versionError.message}`);
      }
      versionId = versionData?.id ?? null;
    }

    if (this.config.enableChangeFeed) {
      const permitNumber = this.getPermitNumber(permit);
      await this.createPermitChange(permitId, versionId, 'amended', now);
      this.logger.debug(`Updated permit ${permitNumber} (id: ${permitId})`);
    }
  }

  private async createPermitChange(permitId: string, versionId: string | null, changeType: string, sourceSeenAt: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('permit_changes')
        .insert({
          permit_id: permitId,
          permit_version_id: versionId,
          change_type: changeType,
          source_seen_at: sourceSeenAt,
          created_at: new Date().toISOString(),
        });

      if (error) {
        this.logger.debug(`Note: Could not create permit change record: ${error.message}`);
      }
    } catch (error) {
      this.logger.debug('Note: permit_changes table not available for change tracking');
    }
  }
}