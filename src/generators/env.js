import path from 'path';
import { writeFile, getDatabaseUrlExample } from '../utils/helpers.js';

export async function generateEnv(projectRoot, config) {
  const backendDir = path.join(projectRoot, 'backend');
  const dbUrl = getDatabaseUrlExample(config.database);

  let content = `# Environment variables
# Copy this file to .env and fill in your values: cp .env.example .env

PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database
DATABASE_URL="${dbUrl}"
`;

  // Add DB-specific hints
  if (config.database === 'sqlite') {
    content += `
# For SQLite, DATABASE_URL is a file path (e.g., file:./dev.db)
`;
  } else if (config.database === 'mysql') {
    content += `
# MySQL example: mysql://user:password@localhost:3306/mydb
`;
  } else if (config.database === 'postgresql') {
    content += `
# PostgreSQL example: postgresql://user:password@localhost:5432/mydb?schema=public
`;
  }

  await writeFile(path.join(backendDir, '.env.example'), content);
  // Also generate at project root for spec compliance (Goal diagram)
  await writeFile(path.join(projectRoot, '.env.example'), content);
}
