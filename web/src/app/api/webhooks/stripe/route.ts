import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '../../../../../src/services/billing';
import { createLogger } from '../../../../../src/services/logger';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const logger = createLogger({ service: 'StripeWebhook' });

// Initialize billing service
const billingService = new BillingService({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  defaultCurrency: 'usd',
});

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body
    const payload = await request.text();
    
    // Get Stripe signature from headers
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      logger.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Process the webhook
    const event = await billingService.handleWebhook(payload, signature);

    // Get supabase client for database updates
    const supabase = await createClient();

    // Handle specific event types that need database updates
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspaceId;
        const planId = session.metadata?.planId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (workspaceId) {
          // Update workspace with subscription info
          const { error: updateError } = await supabase
            .from('workspaces')
            .update({
              plan: planId || 'starter',
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', workspaceId);

          if (updateError) {
            logger.error('Failed to update workspace after checkout', updateError);
          } else {
            logger.info('Workspace updated with subscription info', {
              workspaceId,
              customerId,
              subscriptionId,
              planId,
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const workspaceId = subscription.metadata?.workspaceId;
        const planId = subscription.metadata?.planId;
        const status = subscription.status;
        const cancelAtPeriodEnd = subscription.cancel_at_period_end;

        if (workspaceId) {
          const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };

          if (planId) {
            updateData.plan = planId;
          }

          if (status === 'canceled' || status === 'unpaid') {
            updateData.plan = 'free';
            updateData.stripe_subscription_id = null;
          }

          const { error: updateError } = await supabase
            .from('workspaces')
            .update(updateData)
            .eq('stripe_subscription_id', subscription.id);

          if (updateError) {
            logger.error('Failed to update workspace after subscription update', updateError);
          } else {
            logger.info('Workspace updated after subscription update', {
              subscriptionId: subscription.id,
              status,
              cancelAtPeriodEnd,
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Downgrade to free plan
        const { error: updateError } = await supabase
          .from('workspaces')
          .update({
            plan: 'free',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          logger.error('Failed to downgrade workspace after subscription deletion', updateError);
        } else {
          logger.info('Workspace downgraded to free after subscription deletion', {
            subscriptionId: subscription.id,
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        logger.error('Payment failed', new Error('Invoice payment failed'), {
          invoiceId: invoice.id,
          customerId,
        });

        // Get workspace by customer ID and notify
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (workspace) {
          // TODO: Send notification to workspace owner about payment failure
          // Could use the notification service here
          logger.info('Payment failure detected for workspace', {
            workspaceId: workspace.id,
            invoiceId: invoice.id,
          });
        }
        break;
      }

      default:
        logger.debug('Webhook processed', { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error(
      'Webhook processing failed',
      error instanceof Error ? error : new Error(String(error))
    );
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

/**
 * Verify webhook configuration is working
 */
export async function GET() {
  const hasSecretKey = !!process.env.STRIPE_SECRET_KEY;
  const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;

  if (!hasSecretKey || !hasWebhookSecret) {
    return NextResponse.json(
      {
        status: 'not_configured',
        configured: false,
        missing: [
          !hasSecretKey && 'STRIPE_SECRET_KEY',
          !hasWebhookSecret && 'STRIPE_WEBHOOK_SECRET',
        ].filter(Boolean),
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: 'configured',
    configured: true,
  });
}
