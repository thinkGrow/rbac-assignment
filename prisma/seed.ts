import { PrismaClient, Role, Status } from '@prisma/client';
// import bcrypt from 'bcrypt';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient()

async function main() {
  const permissionsData = [
    {
      key: 'dashboard.view',
      label: 'View Dashboard',
      module: 'dashboard',
    },
    {
      key: 'users.view',
      label: 'View Users',
      module: 'users',
    },
    {
      key: 'users.manage',
      label: 'Manage Users',
      module: 'users',
    },
    {
      key: 'reports.view',
      label: 'View Reports',
      module: 'reports',
    },
    {
      key: 'permissions.manage',
      label: 'Manage Permissions',
      module: 'permissions',
    },
  ]

  for (const permission of permissionsData) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {},
      create: permission,
    })
  }

  const allPermissions = await prisma.permission.findMany()

const adminPassword = (await bcrypt.hash('admin123', 10)) as string;
const managerPassword = (await bcrypt.hash('manager123', 10)) as string;
const agentPassword = (await bcrypt.hash('agent123', 10)) as string;

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@demo.com',
      password: adminPassword,
      role: Role.ADMIN,
      status: Status.ACTIVE,
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {},
    create: {
      name: 'Manager User',
      email: 'manager@demo.com',
      password: managerPassword,
      role: Role.MANAGER,
      status: Status.ACTIVE,
    },
  })

  const agent = await prisma.user.upsert({
    where: { email: 'agent@demo.com' },
    update: {},
    create: {
      name: 'Agent User',
      email: 'agent@demo.com',
      password: agentPassword,
      role: Role.AGENT,
      status: Status.ACTIVE,
    },
  })

  await prisma.userPermission.deleteMany({
    where: {
      userId: {
        in: [admin.id, manager.id, agent.id],
      },
    },
  })

  await prisma.userPermission.createMany({
    data: [
      ...allPermissions.map((permission) => ({
        userId: admin.id,
        permissionId: permission.id,
      })),

      ...allPermissions
        .filter((p) =>
          [
            'dashboard.view',
            'users.view',
            'reports.view',
            'permissions.manage',
          ].includes(p.key),
        )
        .map((permission) => ({
          userId: manager.id,
          permissionId: permission.id,
        })),

      ...allPermissions
        .filter((p) =>
          ['dashboard.view', 'reports.view'].includes(p.key),
        )
        .map((permission) => ({
          userId: agent.id,
          permissionId: permission.id,
        })),
    ],
  })

  console.log('Seed completed successfully')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })