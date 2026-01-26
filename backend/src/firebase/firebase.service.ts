import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import type {
  Messaging,
  BatchResponse,
  MulticastMessage,
} from 'firebase-admin/messaging';

export type FcmBatchSummary = {
  successCount: number;
  failureCount: number;
  failures: Array<{
    index: number;
    code?: string;
    message?: string;
  }>;
  invalidTokens: string[];
};

@Injectable()
export class FirebaseService implements OnModuleInit {
  private initialized = false;

  onModuleInit() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    const projectId = process.env.FCM_PROJECT_ID;
    const clientEmail = process.env.FCM_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FCM_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKeyRaw) {
      throw new Error(
        'Missing FCM env vars (FCM_PROJECT_ID/FCM_CLIENT_EMAIL/FCM_PRIVATE_KEY)',
      );
    }

    // .env stores newlines as "\n"
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    // Avoid "already exists" during watch/hot reload
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    this.initialized = true;
  }

  messaging(): Messaging {
    if (!this.initialized) this.init();
    return admin.messaging();
  }

  private summarizeBatch(
    res: BatchResponse,
    tokens: string[],
  ): FcmBatchSummary {
    const failures = res.responses
      .map((r, index) => ({
        index,
        code: r.error?.code,
        message: r.error?.message,
        success: r.success,
      }))
      .filter((r) => !r.success)
      .map(({ index, code, message }) => ({ index, code, message }));

    const invalidTokens = failures
      .filter(
        (f) =>
          f.code === 'messaging/registration-token-not-registered' ||
          f.code === 'messaging/invalid-registration-token',
      )
      .map((f) => tokens[f.index])
      .filter(Boolean);

    return {
      successCount: res.successCount,
      failureCount: res.failureCount,
      failures,
      invalidTokens,
    };
  }

  async sendMulticast(message: MulticastMessage): Promise<BatchResponse> {
    if (!this.initialized) this.init();

    // Recommended by firebase-admin for multicast.
    // returns BatchResponse with responses: SendResponse[]
    return this.messaging().sendEachForMulticast(message);
  }

  async sendMulticastWithSummary(message: MulticastMessage): Promise<{
    batch: BatchResponse;
    summary: FcmBatchSummary;
  }> {
    const tokens = message.tokens ?? [];
    const batch = await this.sendMulticast(message);
    const summary = this.summarizeBatch(batch, tokens);
    return { batch, summary };
  }
}
