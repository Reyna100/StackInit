/**
 * Configuration model for the CLI.
 * Single source of truth for supported options.
 */

export const FRONTEND_OPTIONS = [
  { name: 'React + Vite', value: 'react-vite', display: 'React + Vite' },
];

export const BACKEND_OPTIONS = [
  { name: 'Express', value: 'express' },
  { name: 'NestJS', value: 'nestjs' },
  { name: 'Fastify', value: 'fastify' },
];

export const DATABASE_OPTIONS = [
  { name: 'MySQL', value: 'mysql' },
  { name: 'PostgreSQL', value: 'postgresql' },
  { name: 'SQLite', value: 'sqlite' },
];

export const ORM_OPTIONS = [
  { name: 'Prisma', value: 'prisma' },
  { name: 'Sequelize', value: 'sequelize' },
  { name: 'Drizzle', value: 'drizzle' },
];

/**
 * @typedef {Object} ProjectConfig
 * @property {string} projectName - sanitized project directory name
 * @property {string} frontend - currently only 'react-vite'
 * @property {string} backend - 'express' | 'nestjs' | 'fastify'
 * @property {string} database - 'mysql' | 'postgresql' | 'sqlite'
 * @property {string} orm - 'prisma' | 'sequelize' | 'drizzle'
 * @property {string} targetDir - absolute path to generated project
 */

/**
 * Create a validated ProjectConfig object.
 */
export function createConfig({ projectName, frontend, backend, database, orm, targetDir }) {
  return { projectName, frontend, backend, database, orm, targetDir };
}

/**
 * Map database value to display label.
 */
export function displayDatabase(db) {
  const map = { mysql: 'MySQL', postgresql: 'PostgreSQL', sqlite: 'SQLite' };
  return map[db] || db;
}

export function displayBackend(b) {
  const map = { express: 'Express', nestjs: 'NestJS', fastify: 'Fastify' };
  return map[b] || b;
}

export function displayOrm(o) {
  const map = { prisma: 'Prisma', sequelize: 'Sequelize', drizzle: 'Drizzle' };
  return map[o] || o;
}

export function displayFrontend(f) {
  if (f === 'react-vite') return 'React + Vite';
  return f;
}
