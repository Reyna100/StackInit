import { spawn } from 'child_process';
import ora from 'ora';

function runCommand(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: 'inherit', shell: true });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command "${cmd} ${args.join(' ')}" failed with code ${code}`));
    });
    child.on('error', reject);
  });
}

function getPackageManager() {
  // Prefer npm (always available). Could detect yarn/pnpm via env, but keep simple.
  return 'npm';
}

/**
 * Install dependencies for generated project.
 * Only installs deps required for the selected stack.
 */
export async function installDependencies(projectRoot, config) {
  const pm = getPackageManager();
  const spinner = ora('Installing dependencies... This may take a minute.').start();

  try {
    // Install backend
    spinner.text = 'Installing backend dependencies...';
    await runCommand(pm, ['install'], `${projectRoot}/backend`);

    // Install frontend
    spinner.text = 'Installing frontend dependencies...';
    await runCommand(pm, ['install'], `${projectRoot}/frontend`);

    spinner.succeed('Dependencies installed');
  } catch (err) {
    spinner.fail('Failed to install dependencies');
    console.log('\nYou can install manually:');
    console.log(`  cd "${config.targetDir}/backend" && ${pm} install`);
    console.log(`  cd "${config.targetDir}/frontend" && ${pm} install`);
    throw err;
  }
}
