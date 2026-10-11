#!/usr/bin/env node
import chalk from 'chalk';
import { promptUser } from './prompts/index.js';
import { runCli } from './cli/index.js';

async function main() {
  console.log(chalk.bold.cyan('\nstackinit'));
  console.log(chalk.dim('Scaffold a full-stack JS app (React+Vite / Express,NestJS,Fastify / MySQL,PostgreSQL,SQLite / Prisma,Sequelize,Drizzle)\n'));

  // Support --skip-install for testing / CI
  const skipInstall = process.argv.includes('--skip-install') || process.argv.includes('--no-install');

  // Support CLI args: --projectName --backend --database --orm (non-interactive)
  const args = parseArgs(process.argv.slice(2));

  let config;
  const targetInput = args.targetDir || args.outDir || args.projectName;
  if (targetInput && args.backend && args.database && args.orm) {
    const path = await import('path');
    const isCurrent = targetInput === '.' || targetInput === './';
    const targetDir = isCurrent ? process.cwd() : path.resolve(process.cwd(), targetInput);
    const resolvedName = isCurrent ? path.basename(process.cwd()) : path.basename(targetDir);
    config = {
      projectName: resolvedName,
      frontend: 'react-vite',
      backend: args.backend,
      database: args.database,
      orm: args.orm,
      targetDir,
    };
    console.log(chalk.dim(`Using CLI args: ${JSON.stringify(config, null, 2)}`));
  } else {
    config = await promptUser();
  }

  await runCli(config, { skipInstall });
}

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        result[key] = next;
        i++;
      } else {
        result[key] = true;
      }
    }
  }
  // normalize
  if (result.projectName) result.projectName = String(result.projectName);
  return result;
}

main().catch((err) => {
  console.error(chalk.red('\nError:'), err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
