import { Controller, Get, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import type { AuthenticatedRequest } from 'src/auth/types/jwt.types';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async me(@Req() req: AuthenticatedRequest) {
    return this.usersService.ensureUser(req.user);
  }

  @Get()
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }
}
