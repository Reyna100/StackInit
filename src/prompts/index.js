import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import { FRONTEND_OPTIONS, BACKEND_OPTIONS, DATABASE_OPTIONS, ORM_OPTIONS } from '../config/index.js';
import { validateProjectName } from '../utils/validation.js';

export async function promptUser() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name or target path ("." = current dir, e.g. "my-app", "../my-app", "D:/projects/my-app"):',
      default: 'my-app',
      validate: validateProjectName,
      filter: (input) => input.trim(),
    },
    {
      type: 'list',
      name: 'frontend',
      message: 'Frontend:',
      choices: FRONTEND_OPTIONS.map((o) => ({ name: o.display || o.name, value: o.value })),
      default: 'react-vite',
    },
    {
      type: 'list',
      name: 'backend',
      message: 'Backend framework:',
      choices: BACKEND_OPTIONS.map((o) => ({ name: o.name, value: o.value })),
      default: 'express',
    },
    {
      type: 'list',
      name: 'database',
      message: 'Database:',
      choices: DATABASE_OPTIONS.map((o) => ({ name: o.name, value: o.value })),
      default: 'postgresql',
    },
    {
      type: 'list',
      name: 'orm',
      message: 'ORM:',
      choices: ORM_OPTIONS.map((o) => ({ name: o.name, value: o.value })),
      default: 'prisma',
    },
  ]);

  // Summary
  console.log('\n' + chalk.bold('Project configuration\n'));
  console.log(`  Frontend : ${chalk.cyan(answers.frontend === 'react-vite' ? 'React + Vite' : answers.frontend)}`);
  console.log(`  Backend  : ${chalk.cyan(displayLabel(answers.backend, BACKEND_OPTIONS))}`);
  console.log(`  Database : ${chalk.cyan(displayLabel(answers.database, DATABASE_OPTIONS))}`);
  console.log(`  ORM      : ${chalk.cyan(displayLabel(answers.orm, ORM_OPTIONS))}`);
  console.log('');

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Create project?',
      default: true,
    },
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Cancelled. No files were created.'));
    process.exit(0);
  }

  const rawInput = answers.projectName.trim();
  const isCurrentDir = rawInput === '.' || rawInput === './';
  const targetDir = isCurrentDir ? process.cwd() : path.resolve(process.cwd(), rawInput);
  const projectName = isCurrentDir ? path.basename(process.cwd()) : path.basename(targetDir);

  return {
    projectName,
    frontend: answers.frontend,
    backend: answers.backend,
    database: answers.database,
    orm: answers.orm,
    targetDir,
  };
}

function displayLabel(value, options) {
  const found = options.find((o) => o.value === value);
  return found ? found.name : value;
}
