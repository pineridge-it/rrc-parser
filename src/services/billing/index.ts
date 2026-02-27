/**
 * Billing Service for Stripe Integration
 * Handles subscriptions, usage-based billing, and payment processing
 */

import Stripe from 'stripe';
import { UUID } from '../../types/common';
import { createLogger } from '../logger';

const logger = createLogger({ service: 'BillingService' });

export interface BillingConfig {
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  defaultCurrency: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: string[];
  limits: {
    aois: number;
    alertsPerMonth: number;
    exportsPerMonth: number;
    apiCallsPerMonth: number;
  };
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

export interface Subscription {
  id: string;
  workspaceId: UUID;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecord {
  id: string;
  workspaceId: UUID;
  resource: 'alerts' | 'exports' | 'api_calls';
  quantity: number;
  timestamp: Date;
  stripeUsageRecordId?: string;
}

export interface Invoice {
  id: string;
  workspaceId: UUID;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  periodStart: Date;
  periodEnd: Date;
  pdfUrl?: string;
  stripeInvoiceId?: string;
  createdAt: Date;
}

// Plan definitions matching PRD
export const PLANS: Record<string, SubscriptionPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Basic alerts and limited AOIs',
    priceMonthly: 99,
    priceYearly: 990,
    currency: 'usd',
    features: [
      'Up to 10 AOIs',
      '100 alerts per month',
      '10 exports per month',
      'Email support'
    ],
    limits: {
      aois: 10,
      alertsPerMonth: 100,
      exportsPerMonth: 10,
      apiCallsPerMonth: 0
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Unlimited AOIs, API access, advanced exports',
    priceMonthly: 199,
    priceYearly: 1990,
    currency: 'usd',
    features: [
      'Unlimited AOIs',
      'Unlimited alerts',
      'Unlimited exports',
      'API access',
      'Advanced analytics',
      'Priority support'
    ],
    limits: {
      aois: -1, // unlimited
      alertsPerMonth: -1,
      exportsPerMonth: -1,
      apiCallsPerMonth: 10000
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Team features, SLA, dedicated support',
    priceMonthly: 0, // custom pricing
    priceYearly: 0,
    currency: 'usd',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'SLA guarantee',
      'Dedicated support',
      'Custom integrations',
      'On-premise option'
    ],
    limits: {
      aois: -1,
      alertsPerMonth: -1,
      exportsPerMonth: -1,
      apiCallsPerMonth: -1
    }
  }
};

export class BillingService {
  private config: BillingConfig;
  private stripe: Stripe;

  constructor(config: BillingConfig) {
    this.config = config;
    this.stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: '2026-02-25.clover',
    });
    logger.info('BillingService initialized');
  }

  /**
   * Get available plans
   */
  getPlans(): SubscriptionPlan[] {
    return Object.values(PLANS);
  }

  /**
   * Get plan by ID
   */
  getPlan(planId: string): SubscriptionPlan | undefined {
    return PLANS[planId];
  }

  /**
   * Create or get Stripe customer for workspace
   */
  async createCustomer(workspaceId: UUID, email: string, name?: string): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          workspaceId,
        },
      });
      
      logger.info('Created Stripe customer', { customerId: customer.id, workspaceId });
      return customer.id;
    } catch (error) {
      logger.error('Failed to create Stripe customer', error instanceof Error ? error : new Error(String(error)), { workspaceId });
      throw error;
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    workspaceId: UUID,
    planId: string,
    billingCycle: 'monthly' | 'yearly',
    customerEmail: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    const plan = this.getPlan(planId);
    if (!plan) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    if (planId === 'enterprise') {
      throw new Error('Enterprise plans require custom setup. Please contact sales.');
    }

    const priceId = billingCycle === 'monthly' ? plan.stripePriceIdMonthly : plan.stripePriceIdYearly;
    
    if (!priceId) {
      throw new Error(`Stripe price ID not configured for plan: ${planId}`);
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        customer_email: customerEmail,
        billing_address_collection: 'required',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: {
          metadata: {
            workspaceId,
            planId,
          },
        },
        metadata: {
          workspaceId,
          planId,
        },
      });

      logger.info('Created checkout session', { sessionId: session.id, workspaceId, planId });
      
      return {
        sessionId: session.id,
        url: session.url || '',
      };
    } catch (error) {
      logger.error('Failed to create checkout session', error instanceof Error ? error : new Error(String(error)), { workspaceId, planId });
      throw error;
    }
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return { url: session.url };
    } catch (error) {
      logger.error('Failed to create portal session', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    stripeSubscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<void> {
    try {
      if (cancelAtPeriodEnd) {
        await this.stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        logger.info('Subscription set to cancel at period end', { stripeSubscriptionId });
      } else {
        await this.stripe.subscriptions.cancel(stripeSubscriptionId);
        logger.info('Subscription cancelled immediately', { stripeSubscriptionId });
      }
    } catch (error) {
      logger.error('Failed to cancel subscription', error instanceof Error ? error : new Error(String(error)), { stripeSubscriptionId });
      throw error;
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(
    stripeSubscriptionId: string,
    newPlanId: string,
    billingCycle: 'monthly' | 'yearly'
  ): Promise<void> {
    const plan = this.getPlan(newPlanId);
    if (!plan) {
      throw new Error(`Invalid plan: ${newPlanId}`);
    }

    const priceId = billingCycle === 'monthly' ? plan.stripePriceIdMonthly : plan.stripePriceIdYearly;
    
    if (!priceId) {
      throw new Error(`Stripe price ID not configured for plan: ${newPlanId}`);
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);

      if (!subscription.items.data[0]?.id) {
        throw new Error('Subscription has no items');
      }

      await this.stripe.subscriptions.update(stripeSubscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id!,
            price: priceId,
          },
        ],
        metadata: {
          planId: newPlanId,
        },
      });

      logger.info('Subscription updated', { stripeSubscriptionId, newPlanId });
    } catch (error) {
      logger.error('Failed to update subscription', error instanceof Error ? error : new Error(String(error)), { stripeSubscriptionId, newPlanId });
      throw error;
    }
  }

  /**
   * Record usage for usage-based billing
   * Note: This method is a placeholder for future metered billing implementation.
   * The current Stripe SDK version (20.4.0) doesn't include the usage records API.
   */
  async recordUsage(
    _stripeSubscriptionItemId: string,
    _quantity: number,
    _timestamp?: number
  ): Promise<void> {
    logger.warn('Usage recording not implemented - requires Stripe SDK upgrade for metered billing');
    // TODO: Implement when upgrading to newer Stripe SDK with usageRecords API
    // await this.stripe.subscriptionItems.usageRecords.create(...)
  }

  /**
   * Get subscription from Stripe
   */
  async getStripeSubscription(stripeSubscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      return await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
    } catch (error) {
      logger.error('Failed to get subscription', error instanceof Error ? error : new Error(String(error)), { stripeSubscriptionId });
      return null;
    }
  }

  /**
   * Get invoices for customer
   */
  async getInvoices(stripeCustomerId: string): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: stripeCustomerId,
        limit: 100,
      });
      
      return invoices.data;
    } catch (error) {
      logger.error('Failed to get invoices', error instanceof Error ? error : new Error(String(error)), { stripeCustomerId });
      return [];
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(payload: string, signature: string): Promise<Stripe.Event> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.config.stripeWebhookSecret
      );

      logger.info('Webhook received', { type: event.type, id: event.id });

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          logger.info('Checkout session completed', { sessionId: session.id, customer: session.customer });
          // TODO: Update workspace with subscription info
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          logger.info('Invoice payment succeeded', { invoiceId: invoice.id });
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          logger.error('Invoice payment failed', new Error('Payment failed'), { invoiceId: invoice.id });
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          logger.info('Subscription updated', { subscriptionId: subscription.id, status: subscription.status });
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          logger.info('Subscription deleted', { subscriptionId: subscription.id });
          break;
        }

        default:
          logger.debug('Unhandled webhook event', { type: event.type });
      }

      return event;
    } catch (error) {
      logger.error('Webhook processing failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Start trial for workspace
   */
  async startTrial(
    stripeCustomerId: string,
    planId: string,
    days: number = 14
  ): Promise<Stripe.Subscription> {
    const plan = this.getPlan(planId);
    if (!plan) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    const priceId = plan.stripePriceIdMonthly;
    
    if (!priceId) {
      throw new Error(`Stripe price ID not configured for plan: ${planId}`);
    }

    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        trial_period_days: days,
        metadata: {
          planId,
          isTrial: 'true',
        },
      });

      logger.info('Trial started', { subscriptionId: subscription.id, customerId: stripeCustomerId, planId, days });
      
      return subscription;
    } catch (error) {
      logger.error('Failed to start trial', error instanceof Error ? error : new Error(String(error)), { stripeCustomerId, planId });
      throw error;
    }
  }

  /**
   * Get Stripe instance for advanced operations
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }
}