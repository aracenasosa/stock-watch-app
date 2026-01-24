import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import type { JwtPayload } from '../auth/types/jwt.types';

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async register(userId: string, token: string, platform: string) {
    return this.prisma.deviceToken.upsert({
      where: { token },
      create: { token, platform, userId },
      update: { platform, userId },
    });
  }

  async list(userId: string) {
    return this.prisma.deviceToken.findMany({
      where: { userId },
      select: { id: true, token: true, platform: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async unregister(userId: string, token: string) {
    const existing = await this.prisma.deviceToken.findFirst({
      where: { token, userId },
      select: { id: true },
    });

    if (!existing) throw new NotFoundException('Device token not found');

    await this.prisma.deviceToken.delete({ where: { token } });
    return { ok: true };
  }

  async findTokensByUserIds(userIds: string[]): Promise<string[]> {
    const rows = await this.prisma.deviceToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });
    return rows.map((r) => r.token);
  }

  async removeManyByToken(tokens: string[]): Promise<number> {
    if (!tokens.length) return 0;
    const res = await this.prisma.deviceToken.deleteMany({
      where: { token: { in: tokens } },
    });
    return res.count;
  }
}
