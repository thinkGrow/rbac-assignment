import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permission } from '../auth/permissions.decorator';

@Controller('users')
export class UsersController {
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permission('users.view')
  @Get()
  getUsers() {
    return {
      message: 'You have access to the users route.',
    };
  }
}
