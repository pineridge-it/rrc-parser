import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '../../../../../src/services/billing';
import { createLogger } from '../../../../../src/services/logger';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const logger = createLogger({ service: 'BillingPortal' });

// Initialize billing service
const billingService = new BillingService({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  defaultCurrency: 'usd',
});

// Validation schema for portal request
const portalSchema = z.object({
  workspaceId: z.string().uuid(),
}).strict();

/**
 * POST /api/billing/portal
 * Create a Stripe customer portal session
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = portalSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      );
    }

    const { workspaceId } = validation.data;

    // Get workspace with Stripe customer ID
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, name, stripe_customer_id')
      .eq('id', workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      );
    }

    if (!workspace.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found for this workspace' },
        { status: 400 }
      );
    }

    // Create portal session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/billing`;

    const session = await billingService.createPortalSession(
      workspace.stripe_customer_id,
      returnUrl
    );

    logger.info('Portal session created', {
      workspaceId,
      customerId: workspace.stripe_customer_id,
      userId: user.id,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    logger.error(
      'Failed to create portal session',
      error instanceof Error ? error : new Error(String(error))
    );
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
