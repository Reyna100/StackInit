import path from 'path';
import { writeFile } from '../../utils/helpers.js';

function getDrizzleConfigContent(database) {
  if (database === 'sqlite') {
    return `import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.js',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
});
`;
  }
  if (database === 'mysql') {
    return `import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.js',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
`;
  }
  // postgresql
  return `import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
`;
}

function getDrizzleTSConfigContent(database) {
  if (database === 'sqlite') {
    return `import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
});
`;
  }
  if (database === 'mysql') {
    return `import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
`;
  }
  return `import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
`;
}

function genDbIndex(database, ext) {
  const schemaImport = ext === 'ts' ? './schema' : './schema.js';
  if (database === 'sqlite') {
    return `import 'dotenv/config';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '${schemaImport}';

const sqlite = new Database(process.env.DATABASE_URL ? process.env.DATABASE_URL.replace('file:', '') : './dev.db');
export const db = drizzle(sqlite, { schema });
`;
  }
  if (database === 'mysql') {
    return `import 'dotenv/config';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '${schemaImport}';

const poolConnection = mysql.createPool(process.env.DATABASE_URL);
export const db = drizzle(poolConnection, { schema, mode: 'default' });
`;
  }
  // postgresql
  return `import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '${schemaImport}';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
`;
}

function genSchema(database, ext) {
  if (database === 'sqlite') {
    return `import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
});
`;
  }
  if (database === 'mysql') {
    return `import { mysqlTable, int, varchar } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
});
`;
  }
  // postgresql
  return `import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
});
`;
}

export async function generateDrizzleOrm(projectRoot, config) {
  const backendDir = path.join(projectRoot, 'backend');
  const isNest = config.backend === 'nestjs';
  const ext = isNest ? 'ts' : 'js';

  const drizzleConfig = isNest ? getDrizzleTSConfigContent(config.database) : getDrizzleConfigContent(config.database);
  await writeFile(path.join(backendDir, `drizzle.config.${ext}`), drizzleConfig);

  const dbIndex = genDbIndex(config.database, ext);
  await writeFile(path.join(backendDir, `src/db/index.${ext}`), dbIndex);

  const schema = genSchema(config.database, ext);
  await writeFile(path.join(backendDir, `src/db/schema.${ext}`), schema);
}
