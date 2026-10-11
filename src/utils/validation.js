/**
 * Combination validation.
 * Designed so new rules can be added without rewriting the CLI.
 *
 * Currently ALL combinations of Backend x Database x ORM are supported (3 x 3 x 3 = 27).
 * The validation layer exists to guard against future unsupported combos and to
 * provide a clear extension point.
 */

import path from 'path';
import { BACKEND_OPTIONS, DATABASE_OPTIONS, ORM_OPTIONS } from '../config/index.js';

const SUPPORTED_BACKENDS = new Set(BACKEND_OPTIONS.map((o) => o.value));
const SUPPORTED_DATABASES = new Set(DATABASE_OPTIONS.map((o) => o.value));
const SUPPORTED_ORMS = new Set(ORM_OPTIONS.map((o) => o.value));

/**
 * Explicitly unsupported combinations.
 * Each entry: { backend, database, orm, reason }
 * Empty by default - all combos supported. Add entries as needed.
 * Use '*' as wildcard for any value.
 */
const UNSUPPORTED_COMBINATIONS = [
  // Example (currently none):
  // { backend: 'nestjs', database: 'sqlite', orm: 'drizzle', reason: 'Drizzle with NestJS+SQLite requires additional setup not yet scaffolded.' }
];

/**
 * Validate a project configuration.
 * @param {import('../config/index.js').ProjectConfig} config
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateCombination(config) {
  const { backend, database, orm } = config;

  if (!SUPPORTED_BACKENDS.has(backend)) {
    return { valid: false, reason: `Unsupported backend: "${backend}". Supported: ${[...SUPPORTED_BACKENDS].join(', ')}` };
  }
  if (!SUPPORTED_DATABASES.has(database)) {
    return { valid: false, reason: `Unsupported database: "${database}". Supported: ${[...SUPPORTED_DATABASES].join(', ')}` };
  }
  if (!SUPPORTED_ORMS.has(orm)) {
    return { valid: false, reason: `Unsupported ORM: "${orm}". Supported: ${[...SUPPORTED_ORMS].join(', ')}` };
  }

  for (const rule of UNSUPPORTED_COMBINATIONS) {
    const backendMatch = rule.backend === '*' || rule.backend === backend;
    const dbMatch = rule.database === '*' || rule.database === database;
    const ormMatch = rule.orm === '*' || rule.orm === orm;
    if (backendMatch && dbMatch && ormMatch) {
      return { valid: false, reason: rule.reason };
    }
  }

  return { valid: true };
}

/**
 * Validate project name or target directory path.
 */
export function validateProjectName(input) {
  if (!input || !input.trim()) return 'Project name or target path is required';
  const trimmed = input.trim();
  if (trimmed === '.' || trimmed === './') return true;

  const resolved = path.resolve(process.cwd(), trimmed);
  const baseName = path.basename(resolved);

  if (!baseName || baseName === '.' || baseName === '/') {
    return 'Invalid target directory';
  }
  if (baseName.length > 214) {
    return 'Project folder name too long (max 214 chars)';
  }
  if (!/^[a-z0-9-_]+$/i.test(baseName)) {
    return `Folder name "${baseName}" may only contain letters, numbers, hyphens and underscores`;
  }
  if (baseName.startsWith('.') || baseName.startsWith('-') || baseName.startsWith('_')) {
    return 'Project folder name cannot start with ., - or _';
  }
  return true;
}
