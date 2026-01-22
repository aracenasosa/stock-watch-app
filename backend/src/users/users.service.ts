import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async ensureUser(auth0Sub: string) {
    return this.prisma.user.upsert({
      where: { auth0Sub },
      update: {},
      create: { auth0Sub },
    });
  }

  async findByAuth0Sub(auth0Sub: string) {
    return this.prisma.user.findUnique({
      where: { auth0Sub },
    });
  }
}
