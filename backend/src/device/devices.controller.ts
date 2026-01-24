import { Body, Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { DevicesService } from './devices.service';
import { UsersService } from 'src/users/users.service';
import type { AuthenticatedRequest } from 'src/auth/types/jwt.types';

@ApiTags('devices')
@ApiBearerAuth('bearer')
@Controller('devices')
export class DevicesController {
  constructor(
    private readonly devices: DevicesService,
    private readonly users: UsersService,
  ) {}

  @Post('register')
  async register(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RegisterDeviceDto,
  ) {
    const user = await this.users.ensureUser(req.user);
    return this.devices.register(user.id, dto.token, dto.platform);
  }

  @Delete('unregister')
  async unregister(
    @Req() req: AuthenticatedRequest,
    @Body() dto: { token: string },
  ) {
    const user = await this.users.ensureUser(req.user);
    return this.devices.unregister(user.id, dto.token);
  }

  @Get()
  async list(@Req() req: AuthenticatedRequest) {
    const user = await this.users.ensureUser(req.user);
    return this.devices.list(user.id);
  }
}
