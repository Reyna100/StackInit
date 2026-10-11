import path from 'path';
import { writeFile } from '../../utils/helpers.js';

function getBackendDeps(orm, database) {
  const deps = {
    fastify: '^4.26.0',
    '@fastify/cors': '^9.0.1',
    dotenv: '^16.3.1',
  };
  if (orm === 'prisma') deps['@prisma/client'] = '^5.10.0';
  else if (orm === 'sequelize') {
    deps['sequelize'] = '^6.37.0';
    if (database === 'mysql') deps['mysql2'] = '^3.9.0';
    else if (database === 'postgresql') { deps['pg'] = '^8.11.0'; deps['pg-hstore'] = '^2.3.4'; }
    else if (database === 'sqlite') deps['sqlite3'] = '^5.1.7';
  } else if (orm === 'drizzle') {
    deps['drizzle-orm'] = '^0.30.0';
    if (database === 'mysql') deps['mysql2'] = '^3.9.0';
    else if (database === 'postgresql') deps['pg'] = '^8.11.0';
    else if (database === 'sqlite') deps['better-sqlite3'] = '^9.1.0';
  }
  return deps;
}

function getDevDeps(orm) {
  const dev = { nodemon: '^3.0.3' };
  if (orm === 'prisma') dev['prisma'] = '^5.10.0';
  if (orm === 'drizzle') dev['drizzle-kit'] = '^0.20.0';
  return dev;
}

export async function generateFastifyBackend(projectRoot, config) {
  const backendDir = path.join(projectRoot, 'backend');
  const deps = getBackendDeps(config.orm, config.database);
  const devDeps = getDevDeps(config.orm);

  const baseName = path.basename(config.projectName);
  await writeFile(
    path.join(backendDir, 'package.json'),
    JSON.stringify(
      {
        name: `${baseName}-backend`,
        version: '1.0.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'nodemon src/index.js',
          start: 'node src/index.js',
        },
        dependencies: deps,
        devDependencies: devDeps,
      },
      null,
      2
    ) + '\n'
  );

  await writeFile(
    path.join(backendDir, 'src/index.js'),
    `import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
${config.orm === 'sequelize' ? `import { sequelize } from './config/database.js';` : ''}
${config.orm === 'drizzle' ? `import { db } from './db/index.js';` : ''}
${config.orm === 'prisma' ? `import { PrismaClient } from '@prisma/client';\nconst prisma = new PrismaClient();` : ''}

dotenv.config();

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
});

fastify.get('/api/health', async (request, reply) => {
  return {
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
});

fastify.setNotFoundHandler((request, reply) => {
  reply.status(404).send({ status: 'error', message: 'Route not found' });
});

fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  const statusCode = error.statusCode || 500;
  reply.status(statusCode).send({
    status: 'error',
    message: statusCode === 500 ? 'Internal server error' : error.message,
    ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
  });
});

${config.orm === 'sequelize' ? `
try {
  await sequelize.authenticate();
  fastify.log.info('Database connection established');
} catch (err) {
  fastify.log.error('Unable to connect to database: ' + err.message);
}
` : ''}
${config.orm === 'drizzle' ? `
fastify.log.info('Database client initialized (Drizzle)');
` : ''}
${config.orm === 'prisma' ? `
try {
  await prisma.$connect();
  fastify.log.info('Database connected (Prisma)');
} catch (err) {
  fastify.log.error('Prisma connection error: ' + err.message);
}
` : ''}

const PORT = parseInt(process.env.PORT || '3000', 10);
try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(\`Server running on http://localhost:\${PORT}\`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
`
  );
}
