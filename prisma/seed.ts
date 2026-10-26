import { PrismaClient } from '@prisma/client';
import { seedStorefrontData } from '../src/lib/storefront-seed';

const prisma = new PrismaClient();

function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
}

async function main() {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const adminPhoneNumbers = (process.env.ADMIN_PHONE_NUMBERS || '+916379386564,+919790991369')
    .split(',')
    .map((value) => normalizePhone(value))
    .filter((value): value is string => Boolean(value));

  // Category seeds
  await prisma.category.upsert({
    where: { slug: 'raw' },
    update: {},
    create: { name: 'Raw', slug: 'raw', sortOrder: 0 },
  });

  await prisma.category.upsert({
    where: { slug: 'cleaned' },
    update: {},
    create: { name: 'Cleaned', slug: 'cleaned', sortOrder: 1 },
  });

  let currentSlot = 1;

  // Seed Admin phone numbers (Owner & Dad)
  for (const phone of adminPhoneNumbers) {
    const isDad = phone.includes('9790991369');
    const name = isDad ? 'Dad (Shop Admin)' : 'Shop Owner (Admin)';
    const user = await prisma.user.upsert({
      where: { phone },
      update: { name },
      create: { phone, name },
    });

    await prisma.adminSlot.upsert({
      where: { slot: currentSlot },
      update: { userId: user.id, identifier: phone },
      create: { slot: currentSlot, userId: user.id, identifier: phone },
    });
    currentSlot++;
  }

  // Seed Admin emails
  for (const email of adminEmails) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name: 'Shop administrator' },
    });

    await prisma.adminSlot.upsert({
      where: { slot: currentSlot },
      update: { userId: user.id, identifier: email },
      create: { slot: currentSlot, userId: user.id, identifier: email },
    });
    currentSlot++;
  }

  await seedStorefrontData(prisma);
  console.log(`Seeding complete. Configured ${adminPhoneNumbers.length} phone admins and ${adminEmails.length} email admins.`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
