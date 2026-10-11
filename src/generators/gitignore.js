import path from 'path';
import { writeFile } from '../utils/helpers.js';

export async function generateGitignore(projectRoot, config) {
  const content = `# Dependencies
node_modules/

# Env
.env
.env.local

# Build
dist/
build/
.vite/

# DB
${config.database === 'sqlite' ? 'dev.db\n*.db\n*.sqlite\n' : ''}
# Prisma
prisma/migrations/

# Drizzle
drizzle/

# Logs
logs/
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
`;
  await writeFile(path.join(projectRoot, '.gitignore'), content);
  // Also backend/frontend gitignores are covered, but add root level
}
