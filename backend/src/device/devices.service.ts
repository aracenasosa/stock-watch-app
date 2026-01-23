import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async register(userSub: string, token: string, platform: string) {
    const user = await this.usersService.ensureUser(userSub);

    return this.prisma.deviceToken.upsert({
      where: { token },
      create: { token, platform, userId: user.id },
      update: { platform, userId: user.id },
    });
  }

  async list(userSub: string) {
    const user = await this.usersService.ensureUser(userSub);

    return this.prisma.deviceToken.findMany({
      where: { userId: user.id },
      select: { id: true, token: true, platform: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async unregister(userSub: string, token: string) {
    const user = await this.usersService.ensureUser(userSub);

    const existing = await this.prisma.deviceToken.findFirst({
      where: { token, userId: user.id },
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
