/**
 * Areas of Interest Service with Free Tier Limits
 */

import { LimitsEnforcer } from '../limits';
import { asUUID } from '../../types/common';

export interface AOICreateRequest {
  name: string;
  description?: string;
  geometry: GeoJSON.Polygon;
  workspaceId: string;
}

export interface AOI {
  id: string;
  name: string;
  description?: string;
  geometry: GeoJSON.Polygon;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AOIService {
  private limitsEnforcer: LimitsEnforcer;

  constructor() {
    this.limitsEnforcer = new LimitsEnforcer();
  }

  /**
   * Create a new AOI with limit enforcement
   */
  async createAOI(request: AOICreateRequest): Promise<AOI> {
    // Check AOI limit before creating
    await this.limitsEnforcer.enforceLimit(
      asUUID(request.workspaceId),
      'aois'
    );

    // TODO: Implement actual AOI creation
    const aoi: AOI = {
      id: crypto.randomUUID(),
      name: request.name,
      description: request.description,
      geometry: request.geometry,
      workspaceId: request.workspaceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.saveAOI(aoi);
    return aoi;
  }

  /**
   * Get AOI count for workspace
   */
  async getAOICount(_workspaceId: string): Promise<number> {
    // TODO: Implement database query
    return 0;
  }

  /**
   * List AOIs for workspace
   */
  async listAOIs(_workspaceId: string): Promise<AOI[]> {
    // TODO: Implement database query
    return [];
  }

  /**
   * Delete an AOI
   */
  async deleteAOI(_aoiId: string): Promise<void> {
    // TODO: Implement database delete
  }

  private async saveAOI(aoi: AOI): Promise<void> {
    // TODO: Implement database insert
    console.log('Saving AOI:', aoi.id);
  }
}

export default AOIService;
