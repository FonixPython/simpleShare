import { config } from "dotenv";
config();

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Create default settings
  const defaultSettings = [
    {
      name: 'global-storage-limit',
      num_value: BigInt(10000000000), // 10GB in bytes
      text_value: null,
      comment: 'Global storage limit for all users in bytes'
    }
  ];

  for (const setting of defaultSettings) {
    await prisma.settings.upsert({
      where: { name: setting.name },
      update: setting,
      create: setting
    });
  }

  console.log('Default settings have been created');

  // Create default admin user
  const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin';
  const adminQuota = BigInt(process.env.DEFAULT_ADMIN_QUOTA || '10737418240'); // 10GB default

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.users.upsert({
    where: { username: adminUsername },
    update: {
      password_hash: passwordHash,
      is_admin: true,
      quota_in_bytes: adminQuota,
    },
    create: {
      username: adminUsername,
      password_hash: passwordHash,
      is_admin: true,
      quota_in_bytes: adminQuota,
    },
  });

  console.log(`Default admin user '${adminUser.username}' has been created/updated (ID: ${adminUser.id})`);
  console.log('IMPORTANT: Please change the default admin password after first login!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
