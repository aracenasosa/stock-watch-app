import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [DevicesController],
  providers: [DevicesService, PrismaService],
  exports: [DevicesService],
  imports: [UsersModule],
})
export class DevicesModule {}
