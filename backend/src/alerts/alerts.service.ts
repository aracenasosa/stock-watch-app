import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(auth0Sub: string, symbol: string, targetPrice: number) {
    const user = await this.usersService.ensureUser(auth0Sub);

    return this.prisma.alert.create({
      data: {
        symbol,
        targetPrice,
        userId: user.id,
      },
    });
  }

  async list(auth0Sub: string) {
    const user = await this.usersService.ensureUser(auth0Sub);

    return this.prisma.alert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(auth0Sub: string, id: string) {
    const user = await this.usersService.ensureUser(auth0Sub);

    return this.prisma.alert.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });
  }
}
