import chalk from 'chalk';
import { validateCombination } from '../utils/validation.js';
import { generateProject } from '../generators/index.js';
import { installDependencies } from '../utils/install.js';
import { ensureEmptyDir } from '../utils/helpers.js';
import { displayBackend, displayDatabase, displayOrm } from '../config/index.js';

export async function runCli(config, options = {}) {
  const { skipInstall = false } = options;

  // Validation
  const result = validateCombination(config);
  if (!result.valid) {
    console.error(chalk.red('\nInvalid combination:'));
    console.error(chalk.red(`  ${result.reason}`));
    console.error(chalk.yellow('\nPlease select a different combination.\n'));
    process.exit(1);
  }

  // Ensure target dir empty
  await ensureEmptyDir(config.targetDir);

  // Generation
  await generateProject(config);

  // Installation
  if (!skipInstall) {
    try {
      await installDependencies(config.targetDir, config);
    } catch (err) {
      console.error(chalk.yellow('\nDependency installation failed, but project was generated.'));
      console.error(chalk.yellow('Run npm install manually in backend/ and frontend/.'));
    }
  } else {
    console.log(chalk.yellow('\nSkipping dependency installation (--skip-install)'));
    console.log('Run:');
    console.log(`  cd "${config.targetDir}/backend" && npm install`);
    console.log(`  cd "${config.targetDir}/frontend" && npm install`);
  }

  // Final instructions
  console.log(chalk.green('\nDone! Project created:\n'));
  console.log(`  ${config.targetDir}`);
  console.log('');
  console.log('Next steps:');
  console.log(chalk.cyan(`  cd "${config.targetDir}"`));
  console.log(chalk.cyan('  cp backend/.env.example backend/.env  # set DATABASE_URL'));
  console.log(chalk.cyan('  cp .env.example .env  # same DATABASE_URL content at project root'));
  if (config.database !== 'sqlite') {
    console.log(chalk.cyan(`  # Ensure ${displayDatabase(config.database)} is running`));
  }
  if (config.orm === 'prisma') {
    console.log(chalk.cyan('  cd backend && npx prisma db push && npx prisma generate'));
  } else if (config.orm === 'drizzle') {
    console.log(chalk.cyan('  cd backend && npx drizzle-kit push'));
  }
  console.log(chalk.cyan('  cd backend && npm run dev   # http://localhost:3000/api/health'));
  console.log(chalk.cyan('  cd frontend && npm run dev  # http://localhost:5173'));
  console.log('');
  console.log(`Stack: React+Vite / ${displayBackend(config.backend)} / ${displayDatabase(config.database)} / ${displayOrm(config.orm)}`);
}
