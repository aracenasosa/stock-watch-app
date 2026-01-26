import { Controller, Get, Post, Req, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import type { AuthenticatedRequest } from 'src/auth/types/jwt.types';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async me(@Req() req: AuthenticatedRequest) {
    return this.usersService.ensureUser(req.user);
  }

  @Post('sync')
  async syncUser(
    @Req() req: AuthenticatedRequest,
    @Body() body: { email?: string; name?: string },
  ) {
    return this.usersService.ensureUser({
      sub: req.user.sub,
      email: body.email || req.user.email,
      name: body.name || req.user.name,
    });
  }

  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }
}
