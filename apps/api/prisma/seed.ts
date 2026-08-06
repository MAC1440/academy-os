import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Welcome123!', 12);
  await prisma.user.upsert({
    where: { email: 'superadmin@academyos.dev' },
    update: { isPlatformAdmin: true, status: 'ACTIVE', deletedAt: null },
    create: {
      email: 'superadmin@academyos.dev',
      passwordHash,
      firstName: 'Platform',
      lastName: 'Administrator',
      isPlatformAdmin: true,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    throw error;
  });
