import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { DevicesModule } from 'src/device/devices.module';

@Module({
  providers: [NotificationsService, PrismaService],
  exports: [NotificationsService],
  imports: [FirebaseModule, DevicesModule],
})
export class NotificationsModule {}
