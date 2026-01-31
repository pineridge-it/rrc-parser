import { UUID } from '../common';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailBaseOptions {
  to: EmailRecipient | EmailRecipient[];
  cc?: EmailRecipient | EmailRecipient[];
  bcc?: EmailRecipient | EmailRecipient[];
  subject: string;
  replyTo?: EmailRecipient;
  headers?: Record<string, string>;
}

export interface TemplateEmailOptions extends EmailBaseOptions {
  templateId: string;
  templateData?: Record<string, any>;
}

export interface RawEmailOptions extends EmailBaseOptions {
  htmlBody?: string;
  textBody?: string;
}

// Union type to enforce template-vs-raw at compile time
export type EmailSendOptions = TemplateEmailOptions | RawEmailOptions;

export interface EmailResult {
  messageId: string;
  providerMessageId?: string;
  accepted: boolean;
  rejectedRecipients?: EmailRecipient[];
  errorMessage?: string;
  timestamp: Date;
}

export interface EmailProviderConfig {
  apiKey: string;
  senderEmail: string;
  senderName?: string;
}

export interface EmailServiceConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * Abstract interface for email providers
 */
export interface EmailProvider {
  send(options: EmailSendOptions): Promise<EmailResult>;
  validateConfig(config: EmailProviderConfig): Promise<boolean>;
  getRateLimitInfo(): Promise<{
    remaining: number;
    resetTime: Date;
    limit: number;
  }>;
}

/**
 * Service for email abstraction
 */
export class EmailService {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  constructor(config: EmailServiceConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Send an email using template or raw content
   */
  async sendEmail(options: EmailSendOptions): Promise<EmailResult> {
    const response = await this.fetchWithAuth('/email/send', {
      method: 'POST',
      body: JSON.stringify(options)
    });

    return response.json();
  }

  /**
   * Send a template email
   */
  async sendTemplateEmail(options: TemplateEmailOptions): Promise<EmailResult> {
    // Ensure we're using template options
    if (!('templateId' in options)) {
      throw new Error('Template email options must include templateId');
    }

    return this.sendEmail(options);
  }

  /**
   * Send a raw email
   */
  async sendRawEmail(options: RawEmailOptions): Promise<EmailResult> {
    // Ensure we're using raw options
    if ('templateId' in options) {
      throw new Error('Raw email options must not include templateId');
    }

    return this.sendEmail(options);
  }

  /**
   * Validate email configuration
   */
  async validateConfig(config: EmailProviderConfig): Promise<boolean> {
    const response = await this.fetchWithAuth('/email/validate-config', {
      method: 'POST',
      body: JSON.stringify(config)
    });

    const result = await response.json();
    return result.valid;
  }

  /**
   * Get email provider rate limit information
   */
  async getRateLimitInfo(): Promise<{
    remaining: number;
    resetTime: Date;
    limit: number;
  }> {
    const response = await this.fetchWithAuth('/email/rate-limit');
    return response.json();
  }

  /**
   * Get email statistics
   */
  async getStats(): Promise<{
    totalSent: number;
    successful: number;
    failed: number;
    averageDeliveryTime: number;
  }> {
    const response = await this.fetchWithAuth('/email/stats');
    return response.json();
  }

  /**
   * Get recent email errors
   */
  async getRecentErrors(limit: number = 50): Promise<Array<{
    recipient: EmailRecipient;
    error: string;
    timestamp: Date;
  }>> {
    const params = new URLSearchParams({ limit: limit.toString() });
    const response = await this.fetchWithAuth(`/email/errors?${params.toString()}`);
    return response.json();
  }

  /**
   * Configure email service settings
   */
  async configure(settings: Partial<EmailServiceConfig>): Promise<void> {
    const response = await this.fetchWithAuth('/email/config', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      throw new Error(`Failed to configure email service: ${response.status}`);
    }
  }

  /**
   * Get current email service configuration
   */
  async getConfig(): Promise<EmailServiceConfig> {
    const response = await this.fetchWithAuth('/email/config');
    return response.json();
  }
}