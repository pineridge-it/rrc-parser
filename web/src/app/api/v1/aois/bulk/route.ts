import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../src/lib/database';
import { UsageService } from '../../../../../src/services/usage';
import { AoiApiResponse } from '../../../../../src/types/api';
import { v4 as uuidv4 } from 'uuid';

interface BulkAoiCreateRequest {
  aois: Array<{
    name: string;
    geometry: any; // GeoJSON geometry object
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    // Parse request body
    const body: BulkAoiCreateRequest = await request.json();
    
    if (!body.aois || !Array.isArray(body.aois)) {
      return createValidationErrorResponse(
        [{ field: 'aois', message: 'AOIs must be an array' }],
        rateLimit
      );
    }

    if (body.aois.length === 0) {
      return createValidationErrorResponse(
        [{ field: 'aois', message: 'At least one AOI is required' }],
        rateLimit
      );
    }

    // Check AOI limit before creating
    const usageService = new UsageService();
    const limitCheck = await usageService.checkLimit(auth.workspaceId, 'aois', body.aois.length);

    if (!limitCheck.allowed) {
      return createApiResponse(
        {
          error: 'LIMIT_EXCEEDED',
          message: `AOI limit would be exceeded. You can create ${limitCheck.available} more AOIs.`,
          current: limitCheck.current,
          limit: limitCheck.limit,
          percentage: limitCheck.percentage,
        },
        402,
        rateLimit
      );
    }

    // Prepare AOIs for insertion
    const aoisToInsert = body.aois.map((aoi) => ({
      id: uuidv4(),
      workspace_id: auth.workspaceId,
      name: aoi.name,
      geometry: aoi.geometry,
      aoi_type: 'imported',
      created_by: auth.apiKeyId, // Track which API key made the change
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Insert AOIs
    const { data, error } = await db
      .from('aois')
      .insert(aoisToInsert)
      .select('id, name, created_at');

    if (error) {
      throw new Error(`Failed to create AOIs: ${error.message}`);
    }

    const createdAois: AoiApiResponse[] = (data || []).map((aoi) => ({
      id: aoi.id,
      name: aoi.name,
      createdAt: aoi.created_at,
    }));

    return createApiResponse(
      {
        message: `Successfully created ${createdAois.length} AOIs`,
        aois: createdAois,
      },
      201,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}