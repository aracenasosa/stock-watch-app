import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private alerts: AlertsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateAlertDto) {
    const userSub = req.user?.sub ?? 'dev-user';
    return this.alerts.create(userSub, dto.symbol, dto.targetPrice);
  }

  @Get()
  list(@Req() req: any) {
    const userSub = req.user?.sub ?? 'dev-user';
    return this.alerts.list(userSub);
  }

  @Delete(':id')
  delete(@Req() req: any, @Param('id') id: string) {
    const userSub = req.user?.sub ?? 'dev-user';
    return this.alerts.delete(userSub, id);
  }
}
