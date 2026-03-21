import { createDatabaseClient } from '../../lib/database';
import { EmailService } from '../email/EmailService';
import { WeeklyDigestEmail } from '../../../web/src/emails/weekly-digest';

interface UserDigestPreference {
  user_id: string;
  workspace_id: string;
  digest_frequency: 'daily' | 'weekly' | 'off';
  digest_day_of_week: number;
  digest_hour_utc: number;
  include_saved_searches: boolean;
  include_status_changes: boolean;
  include_new_operators: boolean;
  last_digest_sent_at: string | null;
}

interface DigestData {
  user_id: string;
  workspace_id: string;
  generated_at: string;
  period_start: string;
  period_end: string;
  saved_searches: Array<{
    search_name: string;
    search_id: string;
    new_count: number;
    sample_permits: Array<{
      permit_api_number: string;
      operator_name: string;
      filed_date: string;
      county: string;
    }>;
  }>;
  status_changes: Array<{
    permit_api_number: string;
    old_status: string;
    new_status: string;
    detected_at: string;
    subscription_name: string;
  }>;
  top_movers: Array<{
    permit_api_number: string;
    operator_name: string;
    county: string;
    status: string;
    filed_date: string;
  }>;
  new_operators: Array<{
    operator_name: string;
    county: string;
    permit_count: number;
  }>;
  summary: {
    total_new_permits: number;
    total_status_changes: number;
    total_saved_searches: number;
    period_start: string;
    period_end: string;
  };
}

export class DigestWorkerService {
  private db: ReturnType<typeof createDatabaseClient>;
  private emailService: EmailService;

  constructor(emailService: EmailService) {
    this.db = createDatabaseClient();
    this.emailService = emailService;
  }

  /**
   * Run the digest worker to send digests to users who are due
   */
  async runDigestWorker(): Promise<void> {
    console.log('Starting digest worker run...');
    
    try {
      // Get users who are due for a digest
      const users = await this.getUsersDueForDigest();
      
      console.log(`Found ${users.length} users due for digest`);
      
      let sentCount = 0;
      let errorCount = 0;
      
      // Process each user
      for (const user of users) {
        try {
          await this.processUserDigest(user);
          sentCount++;
        } catch (error) {
          console.error(`Error processing digest for user ${user.user_id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`Digest worker completed. Sent: ${sentCount}, Errors: ${errorCount}`);
    } catch (error) {
      console.error('Error in digest worker:', error);
      throw error;
    }
  }

  /**
   * Get users who are due for a digest based on their schedule
   */
  private async getUsersDueForDigest(): Promise<UserDigestPreference[]> {
    const { data, error } = await this.db.rpc('get_users_due_for_digest');
    
    if (error) {
      throw new Error(`Failed to get users due for digest: ${error.message}`);
    }
    
    return data || [];
  }

  /**
   * Process digest for a single user
   */
  private async processUserDigest(user: UserDigestPreference): Promise<void> {
    console.log(`Processing digest for user ${user.user_id}`);
    
    try {
      // Determine period for digest
      const { periodStart, periodEnd } = this.calculateDigestPeriod(user);
      
      // Aggregate digest data
      const digestData = await this.aggregateDigestData(
        user.user_id,
        user.workspace_id,
        periodStart,
        periodEnd
      );
      
      if (!digestData) {
        console.log(`No digest data for user ${user.user_id}`);
        return;
      }
      
      // Generate and send email
      await this.sendDigestEmail(digestData);
      
      // Mark digest as sent
      await this.markDigestSent(user.user_id, user.workspace_id);
      
      console.log(`Successfully sent digest to user ${user.user_id}`);
    } catch (error) {
      console.error(`Failed to process digest for user ${user.user_id}:`, error);
      throw error;
    }
  }

  /**
   * Calculate the period for the digest based on user preferences
   */
  private calculateDigestPeriod(user: UserDigestPreference): { 
    periodStart: string; 
    periodEnd: string 
  } {
    const now = new Date();
    
    if (user.digest_frequency === 'daily') {
      // Daily digest: previous 24 hours
      const periodEnd = now.toISOString();
      const periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      return { periodStart, periodEnd };
    } else {
      // Weekly digest: previous 7 days
      const periodEnd = now.toISOString();
      const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      return { periodStart, periodEnd };
    }
  }

  /**
   * Aggregate digest data for a user
   */
  private async aggregateDigestData(
    userId: string,
    workspaceId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<DigestData | null> {
    const { data, error } = await this.db.rpc('aggregate_digest_data', {
      p_user_id: userId,
      p_workspace_id: workspaceId,
      p_period_start: periodStart,
      p_period_end: periodEnd
    });
    
    if (error) {
      throw new Error(`Failed to aggregate digest data: ${error.message}`);
    }
    
    return data || null;
  }

  /**
   * Send the digest email to the user
   */
  private async sendDigestEmail(digestData: DigestData): Promise<void> {
    // In a real implementation, we would get the user's email address
    // For now, we'll use a placeholder
    const userEmail = 'user@example.com';
    
    // Create the email component with the digest data
    const emailComponent = WeeklyDigestEmail({
      userName: 'User',
      periodStart: new Date(digestData.period_start),
      periodEnd: new Date(digestData.period_end),
      savedSearches: digestData.saved_searches,
      statusChanges: digestData.status_changes,
      topMovers: digestData.top_movers,
      newOperators: digestData.new_operators,
      summary: digestData.summary,
      workspaceName: 'Workspace',
      digestUrl: 'https://app.example.com/digest',
      preferencesUrl: 'https://app.example.com/settings/digest',
      unsubscribeUrl: 'https://app.example.com/unsubscribe'
    });
    
    // Convert the React component to HTML
    // Note: In a real implementation, we would use a library like react-email to render the component
    const htmlContent = '<html><body>Digest email content would go here</body></html>';
    
    // Send the email
    await this.emailService.sendRawEmail({
      to: { email: userEmail },
      subject: `Weekly Digest: ${digestData.summary.total_new_permits} new permits`,
      htmlBody: htmlContent,
      textBody: `Weekly Digest: ${digestData.summary.total_new_permits} new permits`
    });
  }

  /**
   * Mark digest as sent for a user
   */
  private async markDigestSent(userId: string, workspaceId: string): Promise<void> {
    const { error } = await this.db.rpc('mark_digest_sent', {
      p_user_id: userId,
      p_workspace_id: workspaceId
    });
    
    if (error) {
      throw new Error(`Failed to mark digest as sent: ${error.message}`);
    }
  }
}