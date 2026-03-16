import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Permission } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { UsersService } from './users.service';

type JwtPayload = {
  sub: string;
  role: string;
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permission('users.view')
  @Get()
  getUsers() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permission('permissions.manage')
  @Patch(':id/permissions')
  updatePermissions(
    @Param('id') userId: string,
    @Body() body: { permissions: string[] },
    @Req() req: Request,
  ) {
    const { sub } = req.user as JwtPayload;
    return this.usersService.updatePermissions(sub, userId, body.permissions);
  }
}
