import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpdateAlertDto } from './dto/update-alert-dto';
import type { AuthenticatedRequest } from 'src/auth/types/jwt.types';

@Controller('alerts')
@ApiBearerAuth('bearer')
@ApiTags('Alerts')
export class AlertsController {
  constructor(private alerts: AlertsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateAlertDto) {
    return this.alerts.create(req.user, dto);
  }

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.alerts.list(req.user);
  }

  @Delete(':id')
  delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.alerts.delete(req.user, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAlertDto,
  ) {
    return this.alerts.update(req.user, id, dto);
  }
}
