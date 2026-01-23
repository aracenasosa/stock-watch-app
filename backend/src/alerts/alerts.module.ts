import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [UsersModule, NotificationsModule],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
