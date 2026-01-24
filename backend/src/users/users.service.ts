import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async ensureUser(params: { sub: string; email?: string; name?: string }) {
    const { sub, email, name } = params;

    return this.prisma.user.upsert({
      where: { auth0Sub: sub },
      update: {
        // only update if provided
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
      },
      create: {
        auth0Sub: sub,
        email,
        name,
      },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany();
  }
}
