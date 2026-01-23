import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { DevicesService } from 'src/device/devices.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly prisma: PrismaService,
    private readonly devices: DevicesService,
  ) {}

  // ✅ KEEP THIS METHOD (single alert / single user)
  async notifyAlertTriggered(params: {
    userId: string;
    symbol: string;
    price: number;
    targetPrice: number;
    alertId: string;
  }) {
    const devices = await this.prisma.deviceToken.findMany({
      where: { userId: params.userId },
      select: { token: true },
    });

    if (devices.length === 0) {
      this.logger.log(`No devices for user=${params.userId}`);
      return { sent: 0, failed: 0 };
    }

    const tokens = devices.map((d) => d.token);

    const { summary } = await this.firebase.sendMulticastWithSummary({
      tokens,
      notification: {
        title: `Alert triggered: ${params.symbol}`,
        body: `Price ${params.price} reached target ${params.targetPrice}`,
      },
      data: {
        type: 'ALERT_TRIGGERED',
        alertId: params.alertId,
        symbol: params.symbol,
        price: String(params.price),
        targetPrice: String(params.targetPrice),
      },
    });

    // 🔥 remove invalid tokens automatically
    if (summary.invalidTokens.length) {
      await this.devices.removeManyByToken(summary.invalidTokens);
      this.logger.warn(
        `Removed ${summary.invalidTokens.length} invalid FCM tokens`,
      );
    }

    this.logger.log(
      `FCM alert=${params.alertId} user=${params.userId} sent=${summary.successCount} failed=${summary.failureCount}`,
    );

    return {
      sent: summary.successCount,
      failed: summary.failureCount,
    };
  }

  // ✅ NEW: batch notification (used by Finnhub ticks)
  async notifyAlertsTriggeredBatch(params: {
    userIds: string[];
    symbol: string;
    price: number;
    targetPrice: number;
  }) {
    const tokens = await this.devices.findTokensByUserIds(params.userIds);
    if (tokens.length === 0) return { sent: 0 };

    const { summary } = await this.firebase.sendMulticastWithSummary({
      tokens,
      notification: {
        title: `Price alert: ${params.symbol}`,
        body: `${params.symbol} is now ${params.price}`,
      },
      data: {
        type: 'PRICE_ALERT',
        symbol: params.symbol,
        price: String(params.price),
        targetPrice: String(params.targetPrice),
      },
    });

    if (summary.invalidTokens.length) {
      await this.devices.removeManyByToken(summary.invalidTokens);
    }

    return { sent: summary.successCount };
  }
}
