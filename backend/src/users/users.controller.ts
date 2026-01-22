import { Controller, Get, Req } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async me(@Req() req: any) {
    const auth0Sub = req.user.sub;
    return this.usersService.ensureUser(auth0Sub);
  }
}
