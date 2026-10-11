import path from 'path';
import { writeFile, getPrismaProvider } from '../../utils/helpers.js';

export async function generatePrismaOrm(projectRoot, config) {
  const backendDir = path.join(projectRoot, 'backend');
  const provider = getPrismaProvider(config.database);

  // prisma/schema.prisma
  await writeFile(
    path.join(backendDir, 'prisma/schema.prisma'),
    `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}

// Example model - extend as needed
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`
  );

  // For SQLite, ensure url example is file-based; note already in .env.example

  // Add prisma client helper if not NestJS (NestJS already has PrismaService)
  if (config.backend !== 'nestjs') {
    await writeFile(
      path.join(backendDir, 'src/config/prisma.js'),
      `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
`
    );
  }
}
