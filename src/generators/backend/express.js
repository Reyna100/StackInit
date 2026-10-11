import path from 'path';
import { writeFile } from '../../utils/helpers.js';

function getBackendDeps(orm, database) {
  const deps = {
    express: '^4.18.2',
    cors: '^2.8.5',
    dotenv: '^16.3.1',
  };
  if (orm === 'prisma') {
    deps['@prisma/client'] = '^5.10.0';
  } else if (orm === 'sequelize') {
    deps['sequelize'] = '^6.37.0';
    if (database === 'mysql') deps['mysql2'] = '^3.9.0';
    else if (database === 'postgresql') deps['pg'] = '^8.11.0';
    else if (database === 'sqlite') deps['sqlite3'] = '^5.1.7';
    if (database === 'postgresql') deps['pg-hstore'] = '^2.3.4';
  } else if (orm === 'drizzle') {
    deps['drizzle-orm'] = '^0.30.0';
    if (database === 'mysql') deps['mysql2'] = '^3.9.0';
    else if (database === 'postgresql') deps['pg'] = '^8.11.0';
    else if (database === 'sqlite') deps['better-sqlite3'] = '^9.1.0';
    deps['dotenv'] = '^16.3.1';
  }
  return deps;
}

function getDevDeps(orm) {
  const dev = { nodemon: '^3.0.3' };
  if (orm === 'prisma') dev['prisma'] = '^5.10.0';
  if (orm === 'drizzle') dev['drizzle-kit'] = '^0.20.0';
  return dev;
}

export async function generateExpressBackend(projectRoot, config) {
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

  // src/index.js - framework-appropriate
  await writeFile(
    path.join(backendDir, 'src/index.js'),
    `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health.js';
${config.orm === 'sequelize' ? `import { sequelize } from './config/database.js';` : ''}
${config.orm === 'drizzle' ? `import { db } from './db/index.js';` : ''}
${config.orm === 'prisma' ? `import { PrismaClient } from '@prisma/client';\nconst prisma = new PrismaClient();` : ''}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/health', healthRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { error: err.message }),
  });
});

${config.orm === 'sequelize' ? `
try {
  await sequelize.authenticate();
  console.log('Database connection established');
} catch (err) {
  console.error('Unable to connect to database:', err.message);
}
` : ''}
${config.orm === 'drizzle' ? `
// Drizzle client initialized in src/db/index.js
console.log('Database client initialized (Drizzle)');
` : ''}
${config.orm === 'prisma' ? `
try {
  await prisma.$connect();
  console.log('Database connected (Prisma)');
} catch (err) {
  console.error('Prisma connection error:', err.message);
}
` : ''}

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
`
  );

  await writeFile(
    path.join(backendDir, 'src/routes/health.js'),
    `import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
`
  );
}
