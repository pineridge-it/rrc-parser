import { NextRequest } from 'next/server';
import {
  authenticateApiRequest,
  createApiResponse,
  createApiErrorResponse,
  createValidationErrorResponse,
} from '../../../../../../src/middleware/api-auth';
import { createDatabaseClient } from '../../../../../../src/lib/database';
import {
  tagDefinitionSchema,
  validateBody,
} from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    const { data, error } = await db
      .from('workspace_tag_definitions')
      .select('id, tag_name, color_hex, created_by, created_at')
      .eq('workspace_id', auth.workspaceId)
      .order('tag_name', { ascending: true });

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return createApiResponse(
      { tags: data },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { auth, rateLimit } = await authenticateApiRequest(request);
    const db = createDatabaseClient();

    const body = await request.json();
    const validation = validateBody(body, tagDefinitionSchema);
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors, rateLimit);
    }

    const { tag_name, color_hex } = validation.data;

    const { data, error } = await db
      .from('workspace_tag_definitions')
      .insert({
        workspace_id: auth.workspaceId,
        tag_name,
        color_hex,
        created_by: auth.apiKeyId, // Track which API key made the change
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return createValidationErrorResponse(
          [{ field: 'tag_name', message: 'Tag with this name already exists' }],
          rateLimit
        );
      }
      throw new Error(`Create failed: ${error.message}`);
    }

    return createApiResponse(
      { tag: data },
      201,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}
