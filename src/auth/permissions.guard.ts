import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'prisma/prisma.service';
import { PERMISSION_KEY } from './permissions.decorator';
import type { Request } from 'express';

type JwtPayload = {
  sub: string;
  role: string;
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: {
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!dbUser) {
      throw new ForbiddenException('User not found');
    }

    const permissions = dbUser.userPermissions.map((up) => up.permission.key);

    if (!permissions.includes(requiredPermission)) {
      throw new ForbiddenException(
        `Missing required permission: ${requiredPermission}`,
      );
    }

    return true;
  }
}
