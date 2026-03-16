import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions: user.userPermissions.map((up) => up.permission.key),
      createdAt: user.createdAt,
    }));
  }

  async updatePermissions(
    actingUserId: string,
    targetUserId: string,
    permissions: string[],
  ) {
    const actingUser = await this.prisma.user.findUnique({
      where: { id: actingUserId },
      include: {
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!actingUser) {
      throw new ForbiddenException('Acting user not found');
    }

    const actingPermissions = actingUser.userPermissions.map(
      (up) => up.permission.key,
    );

    const disallowedPermissions = permissions.filter(
      (permission) => !actingPermissions.includes(permission),
    );

    if (disallowedPermissions.length > 0) {
      throw new ForbiddenException(
        `Cannot assign permissions you do not have: ${disallowedPermissions.join(', ')}`,
      );
    }

    const permissionRecords = await this.prisma.permission.findMany({
      where: {
        key: {
          in: permissions,
        },
      },
    });

    await this.prisma.userPermission.deleteMany({
      where: {
        userId: targetUserId,
      },
    });

    if (permissionRecords.length > 0) {
      await this.prisma.userPermission.createMany({
        data: permissionRecords.map((permission) => ({
          userId: targetUserId,
          permissionId: permission.id,
        })),
      });
    }

    return {
      message: 'Permissions updated successfully',
      assignedPermissions: permissionRecords.map(
        (permission) => permission.key,
      ),
    };
  }
}
