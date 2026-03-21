import { NextRequest } from 'next/server';
import { createDatabaseClient } from '../../../../../../src/lib/database';
import { render } from '@react-email/render';
import { PermitStatusAlertEmail } from '@/emails/permit-status-alert';
import { createLogger } from '../../../../../../src/services/logger';

const logger = createLogger({ service: 'dispatch-alerts' });

const BATCH_SIZE = parseInt(process.env.ALERT_DISPATCH_BATCH_SIZE || '50', 10);
const MAX_RETRIES = 3;

interface PendingEvent {
  id: string;
  subscription_id: string;
  permit_api_number: string;
  old_status: string | null;
  new_status: string | null;
  detected_at: string;
  retry_count: number;
}

interface Subscription {
  id: string;
  workspace_id: string;
  user_id: string | null;
  name: string | null;
  trigger_type: string | null;
  permit_api_number: string | null;
  notify_channels: string[] | null;
}

interface PermitData {
  permit_number: string;
  operator_name: string | null;
  well_status: string | null;
  county_code: string | null;
  lease_name: string | null;
  surface_latitude: number | null;
  surface_longitude: number | null;
}

interface UserProfile {
  id: string;
  email: string | null;
  raw_user_meta_data: { full_name?: string } | null;
}

interface Workspace {
  id: string;
  name: string;
}

async function sendEmail(
  email: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'alerts@rrc-monitor.example.com';

  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Resend API error: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      };
    }
  }

  if (sendgridApiKey) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: fromEmail },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.errors?.[0]?.message || `SendGrid API error: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      };
    }
  }

  logger.warn('No email provider configured (RESEND_API_KEY or SENDGRID_API_KEY)');
  return { success: false, error: 'No email provider configured' };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const db = createDatabaseClient();

  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('Unauthorized dispatch attempt');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    logger.info('Starting alert dispatch');

    const { data: events, error: fetchError } = await db.rpc('dispatch_pending_alerts', {
      p_batch_size: BATCH_SIZE
    });

    if (fetchError) {
      throw new Error(`Failed to fetch pending events: ${fetchError.message}`);
    }

    const dispatched = events?.dispatched || 0;
    const skipped = events?.skipped || 0;
    
    logger.info(`Dispatch batch: ${dispatched} to process, ${skipped} skipped`);

    if (dispatched === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending alerts to dispatch',
        stats: { dispatched: 0, failed: 0, skipped },
        durationMs: Date.now() - startTime,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: pendingEvents, error: eventsError } = await db
      .from('permit_alert_events')
      .select(`
        id,
        subscription_id,
        permit_api_number,
        old_status,
        new_status,
        detected_at,
        retry_count,
        notification_status
      `)
      .eq('notification_status', 'sent')
      .order('detected_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }

    let successCount = 0;
    let failCount = 0;

    const subscriptionIds = [...new Set((pendingEvents || []).map(e => e.subscription_id))];
    const permitNumbers = [...new Set((pendingEvents || []).map(e => e.permit_api_number).filter(Boolean))];

    const { data: subscriptions } = await db
      .from('permit_alert_subscriptions')
      .select('*')
      .in('id', subscriptionIds);

    const { data: permits } = await db
      .from('permits')
      .select('permit_number, operator_name, well_status, county_code, lease_name, surface_latitude, surface_longitude')
      .in('permit_number', permitNumbers);

    const userIds = [...new Set((subscriptions || []).map(s => s.user_id).filter(Boolean))];
    const { data: users } = await db
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .in('id', userIds);

    const workspaceIds = [...new Set((subscriptions || []).map(s => s.workspace_id))];
    const { data: workspaces } = await db
      .from('workspaces')
      .select('id, name')
      .in('id', workspaceIds);

    const subscriptionMap = new Map((subscriptions || []).map(s => [s.id, s]));
    const permitMap = new Map((permits || []).map(p => [p.permit_number, p]));
    const userMap = new Map((users || []).map(u => [u.id, u]));
    const workspaceMap = new Map((workspaces || []).map(w => [w.id, w]));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rrc-monitor.example.com';

    for (const event of (pendingEvents || []) as PendingEvent[]) {
      const subscription = subscriptionMap.get(event.subscription_id) as Subscription | undefined;
      
      if (!subscription) {
        await db.rpc('mark_event_failed', {
          p_event_id: event.id,
          p_error_message: 'Subscription not found'
        });
        failCount++;
        continue;
      }

      const user = subscription.user_id ? userMap.get(subscription.user_id) as UserProfile | undefined : undefined;
      const workspace = workspaceMap.get(subscription.workspace_id) as Workspace | undefined;
      const permit = permitMap.get(event.permit_api_number) as PermitData | undefined;

      const notifyChannels = subscription.notify_channels || [];
      let eventSuccess = true;
      const errors: string[] = [];

      if (notifyChannels.includes('email') && user?.email) {
        const emailHtml = render(
          PermitStatusAlertEmail({
            permitApiNumber: event.permit_api_number || '',
            operatorName: permit?.operator_name || 'Unknown Operator',
            oldStatus: event.old_status || 'Unknown',
            newStatus: event.new_status || 'Unknown',
            county: permit?.county_code || undefined,
            leaseName: permit?.lease_name || undefined,
            latitude: permit?.surface_latitude || undefined,
            longitude: permit?.surface_longitude || undefined,
            workspaceName: workspace?.name || 'Workspace',
            permitDetailUrl: `${baseUrl}/permits/${event.permit_api_number}`,
            preferencesUrl: `${baseUrl}/settings/alerts`,
            unsubscribeUrl: `${baseUrl}/api/alerts/${subscription.id}/unsubscribe`,
          })
        );

        const emailResult = await sendEmail(
          user.email,
          `Permit Status Alert: ${event.permit_api_number}`,
          emailHtml
        );

        if (!emailResult.success) {
          eventSuccess = false;
          errors.push(`Email failed: ${emailResult.error}`);
        }
      }

      if (notifyChannels.includes('in_app') && subscription.user_id) {
        const { error: notifError } = await db.rpc('create_in_app_notification', {
          p_workspace_id: subscription.workspace_id,
          p_user_id: subscription.user_id,
          p_event_id: event.id,
          p_title: `Permit Status Changed: ${event.permit_api_number}`,
          p_message: `${permit?.operator_name || 'Permit'} status changed from ${event.old_status || 'unknown'} to ${event.new_status || 'unknown'}`,
          p_type: 'alert'
        });

        if (notifError) {
          eventSuccess = false;
          errors.push(`In-app notification failed: ${notifError.message}`);
        }
      }

      if (eventSuccess) {
        successCount++;
      } else {
        await db.rpc('mark_event_failed', {
          p_event_id: event.id,
          p_error_message: errors.join('; ')
        });
        failCount++;
      }
    }

    const durationMs = Date.now() - startTime;
    logger.info(`Dispatch complete: ${successCount} sent, ${failCount} failed, ${durationMs}ms`);

    return new Response(JSON.stringify({
      success: true,
      stats: {
        dispatched: successCount,
        failed: failCount,
        skipped,
        batchSize: BATCH_SIZE,
      },
      durationMs,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Dispatch failed: ${errorMessage}`);
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      durationMs: Date.now() - startTime,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET() {
  return new Response(JSON.stringify({
    message: 'Alert dispatch endpoint. Use POST to trigger dispatch.',
    batchSize: BATCH_SIZE,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
