import { UUID } from './common';

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

export interface EmailProvider {
  send(options: EmailSendOptions): Promise<EmailResult>;
  validateConfig(config: EmailProviderConfig): Promise<boolean>;
  getRateLimitInfo(): Promise<{
    remaining: number;
    resetTime: Date;
    limit: number;
  }>;
}

export interface SendEmailRequest {
  options: EmailSendOptions;
}

export interface SendTemplateEmailRequest {
  options: TemplateEmailOptions;
}

export interface SendRawEmailRequest {
  options: RawEmailOptions;
}

export interface ValidateEmailConfigRequest {
  config: EmailProviderConfig;
}

export interface ConfigureEmailServiceRequest {
  settings: Partial<EmailServiceConfig>;
}

export interface EmailError {
  recipient: EmailRecipient;
  error: string;
  timestamp: Date;
}

export interface EmailStats {
  totalSent: number;
  successful: number;
  failed: number;
  averageDeliveryTime: number;
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: Date;
  limit: number;
}