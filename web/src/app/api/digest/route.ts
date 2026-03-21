import { NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/middleware/api-auth';
import { createApiResponse, createApiErrorResponse } from '@/lib/api';
import { DigestWorkerService } from '@/services/notifications/DigestWorkerService';
import { EmailService } from '@/services/email/EmailService';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request (only service role can trigger digests)
    const { auth, rateLimit } = await authenticateApiRequest(request, { requireServiceRole: true });
    
    // Create services
    const emailService = new EmailService();
    const digestWorkerService = new DigestWorkerService(emailService);
    
    // Run the digest worker
    await digestWorkerService.runDigestWorker();
    
    return createApiResponse(
      { message: 'Digest worker completed successfully' },
      200,
      rateLimit
    );
  } catch (error) {
    return createApiErrorResponse(error as Error);
  }
}