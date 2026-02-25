/**
 * Billing Service for Stripe Integration
 * Handles subscriptions, usage-based billing, and payment processing
 */

import { UUID } from '../../types/common';

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

  constructor(config: BillingConfig) {
    this.config = config;
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
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    _workspaceId: UUID,
    planId: string,
    _billingCycle: 'monthly' | 'yearly'
  ): Promise<{ sessionId: string; url: string }> {
    const plan = this.getPlan(planId);
    if (!plan) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    // Placeholder for Stripe checkout session creation
    // In production, this would call Stripe API
    return {
      sessionId: `cs_${Date.now()}`,
      url: `https://checkout.stripe.com/pay/cs_${Date.now()}`
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    workspaceId: UUID,
    _cancelAtPeriodEnd: boolean = true
  ): Promise<void> {
    // Placeholder for Stripe subscription cancellation
    console.log(`Cancelling subscription for workspace ${workspaceId}`);
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(
    workspaceId: UUID,
    newPlanId: string
  ): Promise<void> {
    const plan = this.getPlan(newPlanId);
    if (!plan) {
      throw new Error(`Invalid plan: ${newPlanId}`);
    }

    // Placeholder for Stripe subscription update
    console.log(`Updating subscription for workspace ${workspaceId} to plan ${newPlanId}`);
  }

  /**
   * Record usage for usage-based billing
   */
  async recordUsage(
    workspaceId: UUID,
    resource: 'alerts' | 'exports' | 'api_calls',
    quantity: number
  ): Promise<void> {
    // Placeholder for Stripe usage record creation
    console.log(`Recording usage for workspace ${workspaceId}: ${resource} = ${quantity}`);
  }

  /**
   * Get subscription for workspace
   */
  async getSubscription(_workspaceId: UUID): Promise<Subscription | null> {
    // Placeholder - would fetch from database
    return null;
  }

  /**
   * Get invoices for workspace
   */
  async getInvoices(_workspaceId: UUID): Promise<Invoice[]> {
    // Placeholder - would fetch from database
    return [];
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(_payload: unknown, _signature: string): Promise<void> {
    // Placeholder for Stripe webhook handling
    console.log('Processing Stripe webhook');
  }

  /**
   * Start trial for workspace
   */
  async startTrial(workspaceId: UUID, planId: string, days: number = 14): Promise<void> {
    const plan = this.getPlan(planId);
    if (!plan) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + days);

    // Placeholder - would create trial subscription in database
    console.log(`Starting ${days}-day trial for workspace ${workspaceId} on plan ${planId}`);
  }

  /**
   * Check if workspace is in trial
   */
  async isInTrial(workspaceId: UUID): Promise<boolean> {
    const subscription = await this.getSubscription(workspaceId);
    if (!subscription) return false;
    const trialEnd = subscription.trialEnd;
    if (!trialEnd) return false;
    return subscription.status === 'trialing' && trialEnd > new Date();
  }

  /**
   * Get days remaining in trial
   */
  async getTrialDaysRemaining(workspaceId: UUID): Promise<number> {
    const subscription = await this.getSubscription(workspaceId);
    if (!subscription || !subscription.trialEnd) return 0;
    
    const now = new Date();
    const trialEnd = subscription.trialEnd;
    
    if (trialEnd <= now) return 0;
    
    const diffTime = trialEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

// Export singleton instance
export const billingService = new BillingService({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  defaultCurrency: 'usd'
});

export default BillingService;
