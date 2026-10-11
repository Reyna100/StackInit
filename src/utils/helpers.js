import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

export function sanitizeProjectName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export async function ensureEmptyDir(targetDir) {
  if (await fs.pathExists(targetDir)) {
    const files = await fs.readdir(targetDir);
    if (files.length > 0) {
      throw new Error(`Target directory "${targetDir}" already exists and is not empty. Please choose a different name or remove the directory.`);
    }
  }
}

export async function writeFile(targetPath, content) {
  await fs.ensureDir(path.dirname(targetPath));
  await fs.writeFile(targetPath, content, 'utf-8');
}

export async function copyApiContract(projectRoot) {
  const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/api-contract.md');
  const dest = path.join(projectRoot, 'docs/api-contract.md');
  await fs.ensureDir(path.dirname(dest));
  if (await fs.pathExists(src)) {
    await fs.copy(src, dest);
  } else {
    // Fallback: minimal contract if docs/api-contract.md missing (e.g., npm pack)
    await fs.writeFile(dest, '# API Contract\n\nSee docs/api-contract.md in the CLI repository.\n', 'utf-8');
  }
}

export function getDatabaseUrlExample(database) {
  switch (database) {
    case 'mysql':
      return 'mysql://user:password@localhost:3306/mydb';
    case 'postgresql':
      return 'postgresql://user:password@localhost:5432/mydb?schema=public';
    case 'sqlite':
      return 'file:./dev.db';
    default:
      return '';
  }
}

export function getPrismaProvider(database) {
  switch (database) {
    case 'mysql':
      return 'mysql';
    case 'postgresql':
      return 'postgresql';
    case 'sqlite':
      return 'sqlite';
    default:
      return 'postgresql';
  }
}
