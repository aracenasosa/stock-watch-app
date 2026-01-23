import { Body, Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { DevicesService } from './devices.service';
import { UsersService } from 'src/users/users.service';

@ApiTags('devices')
@ApiBearerAuth('bearer')
@Controller('devices')
export class DevicesController {
  constructor(
    private readonly devices: DevicesService,
    private readonly users: UsersService,
  ) {}

  @Post('register')
  async register(@Req() req: any, @Body() dto: RegisterDeviceDto) {
    const sub = req.user?.sub ?? 'dev-user';
    const user = await this.users.ensureUser(sub);
    return this.devices.register(user.id, dto.token, dto.platform);
  }

  @Delete('unregister')
  async unregister(@Req() req: any, @Body() dto: { token: string }) {
    const sub = req.user?.sub ?? 'dev-user';
    const user = await this.users.ensureUser(sub);
    return this.devices.unregister(user.id, dto.token);
  }

  @Get()
  async list(@Req() req: any) {
    const sub = req.user?.sub ?? 'dev-user';
    const user = await this.users.ensureUser(sub);
    return this.devices.list(user.id);
  }
}
