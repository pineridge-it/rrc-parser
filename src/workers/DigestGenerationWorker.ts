import { createDatabaseClient } from '../lib/database';
import { SupabaseClient } from '@supabase/supabase-js';
import { DigestAggregationService } from '../services/digest/DigestAggregationService';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface DigestPreferences {
  workspace_id: string;
  digest_enabled: boolean;
  digest_frequency: string;
  digest_day_of_week: number;
  digest_hour_utc: number;
  last_digest_sent_at: string | null;
}

interface UserWithPreferences extends User {
  digest_preferences: DigestPreferences[];
}

/**
 * Digest Generation Worker
 * Generates and sends digest emails to users on schedule
 */
export class DigestGenerationWorker {
  private db: SupabaseClient;

  constructor() {
    this.db = createDatabaseClient();
  }

  /**
   * Generate and send digest emails to all eligible users
   */
  async run(): Promise<void> {
    console.log('Starting digest generation worker...');
    
    try {
      // Get all users with digest enabled
      const users = await this.getEligibleUsers();
      
      console.log(`Processing digests for ${users.length} users`);
      
      // Process each user
      for (const user of users) {
        try {
          await this.processUser(user);
        } catch (error) {
          console.error(`Error processing user ${user.id}:`, error);
        }
      }
      
      console.log('Digest generation worker completed successfully');
    } catch (error) {
      console.error('Error in digest generation worker:', error);
      throw error;
    }
  }

  /**
   * Get all users eligible for digest emails
   */
  private async getEligibleUsers(): Promise<User[]> {
    try {
      // Get users with digest enabled and matching schedule
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const hourUtc = now.getUTCHours();
      
      // Join users with their digest preferences
      const { data, error } = await this.db
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          digest_preferences:user_digest_preferences(
            workspace_id,
            digest_enabled,
            digest_frequency,
            digest_day_of_week,
            digest_hour_utc,
            last_digest_sent_at
          )
        `)
        .eq('digest_preferences.digest_enabled', true)
        .eq('digest_preferences.digest_hour_utc', hourUtc);
      
      if (error) {
        throw new Error(`Failed to fetch eligible users: ${error.message}`);
      }
      
      // Filter users based on frequency and day
      const eligibleUsers = (data || [] as UserWithPreferences[]).filter((user: UserWithPreferences) => {
        const prefs = user.digest_preferences?.[0];
        if (!prefs) return false;

        // Check if it's the right day for weekly digests
        if (prefs.digest_frequency === 'weekly' && prefs.digest_day_of_week !== dayOfWeek) {
          return false;
        }

        // Check if it's time for daily digests
        if (prefs.digest_frequency === 'daily') {
          // For daily digests, we just need to match the hour
          return true;
        }

        // For weekly digests, we already checked the day
        return prefs.digest_frequency === 'weekly';
      }).map((user: UserWithPreferences) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      }));
      
      return eligibleUsers;
    } catch (error) {
      console.error('Error fetching eligible users:', error);
      throw error;
    }
  }

  /**
   * Process a single user for digest generation
   */
  private async processUser(user: User): Promise<void> {
    try {
      console.log(`Processing digest for user ${user.id}`);
      
      // Get user's workspace (assuming single workspace for simplicity)
      const workspace = await this.getUserWorkspace(user.id);
      if (!workspace) {
        console.warn(`No workspace found for user ${user.id}`);
        return;
      }
      
      // Aggregate digest data
      const aggregationService = new DigestAggregationService();
      const digestData = await aggregationService.aggregateDigestData(user.id, workspace.id);
      
      if (!digestData) {
        console.log(`No digest data for user ${user.id}`);
        return;
      }
      
      // Render email template
      // Note: In a real implementation, we would use a library like react-email to render the component
      const emailHtml = `
        <html>
          <body>
            <h1>Weekly Digest for ${user.first_name || 'User'}</h1>
            <p>New Permits: ${digestData.summary_stats.total_new_permits}</p>
            <p>Status Changes: ${digestData.summary_stats.total_status_changes}</p>
          </body>
        </html>
      `;

      // Send email
      await this.sendEmail(user.email, emailHtml, digestData);
      
      // Update last digest sent timestamp
      await this.updateLastDigestSent(user.id, workspace.id);
      
      console.log(`Digest sent successfully to user ${user.id}`);
    } catch (error) {
      console.error(`Error processing user ${user.id}:`, error);
    }
  }

  /**
   * Get user's workspace
   */
  private async getUserWorkspace(userId: string): Promise<{ id: string } | null> {
    try {
      const { data, error } = await this.db
        .from('workspaces')
        .select('id')
        .eq('created_by', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new Error(`Failed to fetch user workspace: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching workspace for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Send digest email to user
   */
  private async sendEmail(to: string, _html: string, digestData: any): Promise<void> {
    try {
      // In a real implementation, this would integrate with an email service like Resend or SendGrid
      // For now, we'll just log the email content

      const subject = `Weekly Permit Digest - ${digestData.summary_stats.total_new_permits} new permits`;

      console.log(`Sending digest email to ${to}: ${subject}`);
      // console.log(html); // Uncomment to see the full HTML

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error sending email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Update last digest sent timestamp
   */
  private async updateLastDigestSent(userId: string, workspaceId: string): Promise<void> {
    try {
      const { error } = await this.db
        .from('user_digest_preferences')
        .update({
          last_digest_sent_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId);

      if (error) {
        throw new Error(`Failed to update last digest sent timestamp: ${error.message}`);
      }
    } catch (error) {
      console.error(`Error updating last digest sent for user ${userId}:`, error);
    }
  }

}