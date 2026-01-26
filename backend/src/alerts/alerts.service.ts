import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert-dto';
import type { JwtPayload } from 'src/auth/types/jwt.types';

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private notifications: NotificationsService,
  ) {}

  async create(userPayload: JwtPayload, dto: CreateAlertDto) {
    const user = await this.usersService.ensureUser(userPayload);

    const symbol = dto.symbol.trim().toUpperCase();
    const targetPrice = dto.targetPrice;

    try {
      return await this.prisma.alert.create({
        data: {
          userId: user.id,
          symbol,
          targetPrice,
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException(
          `An active alert for ${symbol} at ${targetPrice} already exists`,
        );
      }
      throw e;
    }
  }

  async list(userPayload: JwtPayload) {
    const user = await this.usersService.ensureUser(userPayload);

    return this.prisma.alert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Make delete consistent: accept userPayload, resolve user, then check ownership
  async delete(userPayload: JwtPayload, alertId: string) {
    const user = await this.usersService.ensureUser(userPayload);

    const alert = await this.prisma.alert.findFirst({
      where: { id: alertId, userId: user.id },
      select: { id: true },
    });

    if (!alert) throw new NotFoundException('Alert not found');

    await this.prisma.alert.delete({ where: { id: alertId } });
    return { success: true };
  }

  async update(userPayload: JwtPayload, alertId: string, dto: UpdateAlertDto) {
    // validate input BEFORE DB
    const data: { symbol?: string; targetPrice?: number } = {};

    if (dto.symbol !== undefined) {
      const sym = dto.symbol.trim().toUpperCase();
      if (!sym) throw new BadRequestException('Symbol cannot be empty');
      data.symbol = sym;
    }

    if (dto.targetPrice !== undefined) {
      const price = dto.targetPrice;
      if (typeof price !== 'number' || !Number.isFinite(price)) {
        throw new BadRequestException('targetPrice must be a valid number');
      }
      if (price <= 0) {
        throw new BadRequestException('targetPrice must be greater than 0');
      }
      data.targetPrice = price;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'At least one of "symbol" or "targetPrice" must be provided',
      );
    }

    const user = await this.usersService.ensureUser(userPayload);

    const existing = await this.prisma.alert.findFirst({
      where: { id: alertId, userId: user.id },
      select: { id: true, isTriggered: true },
    });

    if (!existing) throw new NotFoundException('Alert not found');
    if (existing.isTriggered) {
      throw new ConflictException('Triggered alerts cannot be updated');
    }

    try {
      return await this.prisma.alert.update({
        where: { id: existing.id },
        data,
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException(
          'An active alert with the same symbol and target price already exists',
        );
      }
      throw e;
    }
  }

  async evaluateTick(symbol: string, price: number) {
    // Defensive normalization
    const sym = symbol.trim().toUpperCase();

    const alerts = await this.prisma.alert.findMany({
      where: {
        symbol: sym,
        isTriggered: false,
        targetPrice: { lte: price },
      },
      select: { id: true, userId: true, targetPrice: true },
    });

    if (alerts.length === 0) return { triggered: 0 };

    await this.prisma.alert.updateMany({
      where: { id: { in: alerts.map((a) => a.id) } },
      data: { isTriggered: true, triggeredAt: new Date() },
    });

    // Small professional improvement: reduce spam by deduping per user
    // (still sends at least one notification per user)
    const byUser = new Map<string, { maxTarget: number; alertId: string }>();
    for (const a of alerts) {
      const prev = byUser.get(a.userId);
      if (!prev || a.targetPrice > prev.maxTarget) {
        byUser.set(a.userId, { maxTarget: a.targetPrice, alertId: a.id });
      }
    }

    await Promise.all(
      Array.from(byUser.entries()).map(([userId, info]) =>
        this.notifications.notifyAlertTriggered({
          userId,
          symbol: sym,
          price,
          targetPrice: info.maxTarget,
          alertId: info.alertId,
        }),
      ),
    );

    return { triggered: alerts.length };
  }

  /**
   * Returns all unique symbols that have at least one active (non-triggered) alert.
   * This is used by the FinnhubGateway to ensure we monitor these symbols globally.
   */
  async getUniqueAlertSymbols(): Promise<string[]> {
    const alerts = await this.prisma.alert.findMany({
      where: { isTriggered: false },
      select: { symbol: true },
      distinct: ['symbol'],
    });
    return alerts.map((a) => a.symbol);
  }
}
