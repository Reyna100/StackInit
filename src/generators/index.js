import fs from 'fs-extra';
import path from 'path';
import { generateFrontend } from './frontend/index.js';
import { generateExpressBackend } from './backend/express.js';
import { generateFastifyBackend } from './backend/fastify.js';
import { generateNestjsBackend } from './backend/nestjs.js';
import { generatePrismaOrm } from './orm/prisma.js';
import { generateSequelizeOrm } from './orm/sequelize.js';
import { generateDrizzleOrm } from './orm/drizzle.js';
import { generateEnv } from './env.js';
import { generateReadme } from './readme.js';
import { generateGitignore } from './gitignore.js';
import ora from 'ora';

export async function generateProject(config) {
  const spinner = ora('Generating project...').start();

  try {
    await fs.ensureDir(config.targetDir);

    // Backend generation (framework-specific)
    spinner.text = 'Generating backend...';
    if (config.backend === 'express') {
      await generateExpressBackend(config.targetDir, config);
    } else if (config.backend === 'fastify') {
      await generateFastifyBackend(config.targetDir, config);
    } else if (config.backend === 'nestjs') {
      await generateNestjsBackend(config.targetDir, config);
    }

    // ORM + DB generation (must run after backend base so files merge correctly)
    spinner.text = `Generating ORM (${config.orm}) for ${config.database}...`;
    if (config.orm === 'prisma') {
      await generatePrismaOrm(config.targetDir, config);
    } else if (config.orm === 'sequelize') {
      await generateSequelizeOrm(config.targetDir, config);
    } else if (config.orm === 'drizzle') {
      await generateDrizzleOrm(config.targetDir, config);
    }

    // Frontend
    spinner.text = 'Generating frontend...';
    await generateFrontend(config.targetDir, config);

    // Env
    spinner.text = 'Generating environment config...';
    await generateEnv(config.targetDir, config);

    // Gitignore + README
    spinner.text = 'Generating README and .gitignore...';
    await generateGitignore(config.targetDir, config);
    await generateReadme(config.targetDir, config);

    spinner.succeed('Project generated');
  } catch (err) {
    spinner.fail('Failed to generate project');
    throw err;
  }
}
