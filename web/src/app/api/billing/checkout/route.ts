import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '../../../../../src/services/billing';
import { createLogger } from '../../../../../src/services/logger';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const logger = createLogger({ service: 'BillingCheckout' });

// Initialize billing service
const billingService = new BillingService({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  defaultCurrency: 'usd',
});

// Validation schema for checkout request
const checkoutSchema = z.object({
  planId: z.enum(['starter', 'pro', 'enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']),
  workspaceId: z.string().uuid(),
}).strict();

/**
 * POST /api/billing/checkout
 * Create a Stripe checkout session for subscription
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
    const validation = checkoutSchema.safeParse(body);
    
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

    const { planId, billingCycle, workspaceId } = validation.data;

    // Verify user has access to workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('id', workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      );
    }

    // Get user email
    const userEmail = user.email || '';

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/billing/cancel`;

    const session = await billingService.createCheckoutSession(
      workspaceId,
      planId,
      billingCycle,
      userEmail,
      successUrl,
      cancelUrl
    );

    logger.info('Checkout session created', {
      sessionId: session.sessionId,
      workspaceId,
      planId,
      userId: user.id,
    });

    return NextResponse.json({
      sessionId: session.sessionId,
      url: session.url,
    });
  } catch (error) {
    logger.error(
      'Failed to create checkout session',
      error instanceof Error ? error : new Error(String(error))
    );
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/checkout
 * Get available plans
 */
export async function GET() {
  try {
    const plans = billingService.getPlans();
    
    return NextResponse.json({ plans });
  } catch (error) {
    logger.error(
      'Failed to get plans',
      error instanceof Error ? error : new Error(String(error))
    );
    
    return NextResponse.json(
      { error: 'Failed to get plans' },
      { status: 500 }
    );
  }
}
