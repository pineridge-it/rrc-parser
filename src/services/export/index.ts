/**
 * Export Service for Data Export System
 * Handles export job creation, processing, and management
 */

import {
  ExportRequest,
  ExportJob,
  getExportFormatConfig
} from '../../types/export';
import { UsageService } from '../usage';
import { v4 as uuidv4 } from 'uuid';
import { asUUID } from '../../types/common';

/**
 * Export service configuration
 */
interface ExportServiceConfig {
  downloadBaseUrl: string;
  downloadExpiryHours: number;
  maxConcurrentJobs: number;
  storagePath: string;
  enforceUsageLimits: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ExportServiceConfig = {
  downloadBaseUrl: process.env.EXPORT_DOWNLOAD_URL || 'https://api.permitmap.io/exports',
  downloadExpiryHours: 24,
  maxConcurrentJobs: 5,
  storagePath: process.env.EXPORT_STORAGE_PATH || '/tmp/exports',
  enforceUsageLimits: true
};

/**
 * Error thrown when usage limit is exceeded
 */
export class UsageLimitExceededError extends Error {
  constructor(resource: string, current: number, limit: number) {
    super(`Usage limit exceeded for ${resource}: ${current}/${limit}`);
    this.name = 'UsageLimitExceededError';
  }
}

/**
 * Export Service class
 */
export class ExportService {
  private config: ExportServiceConfig;
  private activeJobs: Map<string, AbortController> = new Map();
  private usageService: UsageService;

  constructor(config: Partial<ExportServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.usageService = new UsageService();
  }

  /**
   * Create a new export job
   */
  async createExport(request: ExportRequest): Promise<ExportJob> {
    // Check usage limits if enforcement is enabled
    if (this.config.enforceUsageLimits) {
      const checkResult = await this.usageService.checkLimit(
        asUUID(request.workspaceId),
        'exports',
        1
      );

      if (!checkResult.allowed) {
        throw new UsageLimitExceededError(
          'exports',
          checkResult.current,
          checkResult.limit
        );
      }
    }

    const formatConfig = getExportFormatConfig(request.format);

    const job: ExportJob = {
      id: uuidv4(),
      workspaceId: request.workspaceId,
      status: 'pending',
      format: request.format,
      filters: request.filters,
      fields: request.fields,
      includeGeometry: request.includeGeometry,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate geometry support
    if (request.includeGeometry && !formatConfig.supportsGeometry) {
      throw new Error(`Format ${request.format} does not support geometry export`);
    }

    // Store job in database (placeholder)
    await this.saveJob(job);

    // Start processing if under concurrent limit
    if (this.activeJobs.size < this.config.maxConcurrentJobs) {
      this.processJob(job.id);
    }

    return job;
  }

  /**
   * Get export job status
   */
  async getExportStatus(jobId: string): Promise<ExportJob | null> {
    return this.loadJob(jobId);
  }

  /**
   * List exports for a workspace
   */
  async listExports(workspaceId: string, limit: number = 50): Promise<ExportJob[]> {
    return this.loadJobsForWorkspace(workspaceId, limit);
  }

  /**
   * Cancel an export job
   */
  async cancelExport(jobId: string): Promise<boolean> {
    const controller = this.activeJobs.get(jobId);
    if (controller) {
      controller.abort();
      this.activeJobs.delete(jobId);
    }

    const job = await this.loadJob(jobId);
    if (!job) {
      return false;
    }

    if (job.status === 'pending' || job.status === 'processing') {
      job.status = 'failed';
      job.errorMessage = 'Cancelled by user';
      job.updatedAt = new Date();
      await this.saveJob(job);
      return true;
    }

    return false;
  }

  /**
   * Process an export job
   */
  private async processJob(jobId: string): Promise<void> {
    const controller = new AbortController();
    this.activeJobs.set(jobId, controller);

    try {
      const job = await this.loadJob(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Update status to processing
      job.status = 'processing';
      job.startedAt = new Date();
      job.updatedAt = new Date();
      await this.saveJob(job);

      // Fetch permits based on filters
      const permits = await this.fetchPermits(job.filters, controller.signal);
      job.recordCount = permits.length;

      // Generate export file
      const fileBuffer = await this.generateExport(job, permits, controller.signal);
      
      // Store file and generate download URL
      const fileName = `export-${job.id}${getExportFormatConfig(job.format).extension}`;
      const downloadUrl = await this.storeFile(fileName, fileBuffer);
      
      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.config.downloadExpiryHours);

      // Update job as completed
      job.status = 'completed';
      job.downloadUrl = downloadUrl;
      job.expiresAt = expiresAt;
      job.fileSize = fileBuffer.length;
      job.completedAt = new Date();
      job.updatedAt = new Date();
      await this.saveJob(job);

    } catch (error) {
      const job = await this.loadJob(jobId);
      if (job) {
        job.status = 'failed';
        job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        job.updatedAt = new Date();
        await this.saveJob(job);
      }
    } finally {
      this.activeJobs.delete(jobId);
      // Process next pending job if any
      this.processNextPendingJob();
    }
  }

  /**
   * Process next pending job
   */
  private async processNextPendingJob(): Promise<void> {
    if (this.activeJobs.size >= this.config.maxConcurrentJobs) {
      return;
    }

    const pendingJob = await this.loadNextPendingJob();
    if (pendingJob) {
      this.processJob(pendingJob.id);
    }
  }

  /**
   * Fetch permits based on filters
   */
  private async fetchPermits(_filters: ExportRequest['filters'], _signal: AbortSignal): Promise<any[]> {
    // This would integrate with the permit service
    // Placeholder implementation
    return [];
  }

  /**
   * Generate export file
   */
  private async generateExport(
    job: ExportJob, 
    permits: any[], 
    signal: AbortSignal
  ): Promise<Buffer> {
    switch (job.format) {
      case 'csv':
        return this.generateCSV(job, permits, signal);
      case 'xlsx':
        return this.generateExcel(job, permits, signal);
      case 'geojson':
        return this.generateGeoJSON(job, permits, signal);
      case 'shapefile':
        return this.generateShapefile(job, permits, signal);
      case 'kml':
        return this.generateKML(job, permits, signal);
      default:
        throw new Error(`Unsupported format: ${job.format}`);
    }
  }

  /**
   * Generate CSV export
   */
  private async generateCSV(
    job: ExportJob,
    permits: any[],
    _signal: AbortSignal
  ): Promise<Buffer> {
    const fields = job.fields || this.getDefaultFields();
    const headers = fields.join(',');
    
    const rows = permits.map(permit => {
      return fields.map(field => {
        const value = permit[field];
        // Escape values containing commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',');
    });

    const csv = [headers, ...rows].join('\n');
    return Buffer.from(csv, 'utf-8');
  }

  /**
   * Generate Excel export
   */
  private async generateExcel(
    job: ExportJob, 
    permits: any[], 
    signal: AbortSignal
  ): Promise<Buffer> {
    // Would use a library like xlsx or exceljs
    // Placeholder - returns CSV for now
    return this.generateCSV(job, permits, signal);
  }

  /**
   * Generate GeoJSON export
   */
  private async generateGeoJSON(
    job: ExportJob,
    permits: any[],
    _signal: AbortSignal
  ): Promise<Buffer> {
    const features = permits.map(permit => ({
      type: 'Feature',
      properties: this.filterFields(permit, job.fields),
      geometry: job.includeGeometry ? this.getPermitGeometry(permit) : null
    }));

    const geojson = {
      type: 'FeatureCollection',
      features
    };

    return Buffer.from(JSON.stringify(geojson, null, 2), 'utf-8');
  }

  /**
   * Generate Shapefile export
   */
  private async generateShapefile(
    _job: ExportJob,
    _permits: any[],
    _signal: AbortSignal
  ): Promise<Buffer> {
    // Would use a library like shp-write
    // Placeholder
    throw new Error('Shapefile export not yet implemented');
  }

  /**
   * Generate KML export
   */
  private async generateKML(
    job: ExportJob,
    permits: any[],
    _signal: AbortSignal
  ): Promise<Buffer> {
    const placemarks = permits.map(permit => {
      const properties = this.filterFields(permit, job.fields);
      const geometry = job.includeGeometry ? this.getPermitGeometry(permit) : null;
      
      let coordinates = '';
      if (geometry && geometry.coordinates) {
        coordinates = geometry.coordinates.join(',');
      }

      return `
        <Placemark>
          <name>${permit.permit_number || 'Unknown'}</name>
          <description>
            <![CDATA[
              ${Object.entries(properties).map(([k, v]) => `<b>${k}:</b> ${v}<br/>`).join('')}
            ]]>
          </description>
          <Point>
            <coordinates>${coordinates}</coordinates>
          </Point>
        </Placemark>
      `;
    }).join('');

    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Permit Export</name>
    ${placemarks}
  </Document>
</kml>`;

    return Buffer.from(kml, 'utf-8');
  }

  /**
   * Get default export fields
   */
  private getDefaultFields(): string[] {
    return [
      'permit_number',
      'operator_name',
      'lease_name',
      'well_number',
      'county',
      'well_type',
      'filed_date',
      'well_status'
    ];
  }

  /**
   * Filter permit fields
   */
  private filterFields(permit: any, fields?: string[]): Record<string, any> {
    const targetFields = fields || this.getDefaultFields();
    const result: Record<string, any> = {};
    
    for (const field of targetFields) {
      result[field] = permit[field];
    }
    
    return result;
  }

  /**
   * Get permit geometry
   */
  private getPermitGeometry(_permit: any): any {
    // Placeholder - would extract actual coordinates from permit data
    return {
      type: 'Point',
      coordinates: [0, 0]
    };
  }

  /**
   * Store file and return download URL
   */
  private async storeFile(fileName: string, _buffer: Buffer): Promise<string> {
    // Placeholder - would store in S3 or similar
    return `${this.config.downloadBaseUrl}/${fileName}`;
  }

  /**
   * Save job to database
   */
  private async saveJob(_job: ExportJob): Promise<void> {
    // Placeholder - would save to database
  }

  /**
   * Load job from database
   */
  private async loadJob(_jobId: string): Promise<ExportJob | null> {
    // Placeholder - would load from database
    return null;
  }

  /**
   * Load jobs for workspace
   */
  private async loadJobsForWorkspace(_workspaceId: string, _limit: number): Promise<ExportJob[]> {
    // Placeholder - would load from database
    return [];
  }

  /**
   * Load next pending job
   */
  private async loadNextPendingJob(): Promise<ExportJob | null> {
    // Placeholder - would load from database
    return null;
  }
}

// Export singleton instance
export const exportService = new ExportService();
