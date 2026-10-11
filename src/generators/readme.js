import path from 'path';
import { writeFile, getDatabaseUrlExample } from '../utils/helpers.js';
import { displayBackend, displayDatabase, displayOrm } from '../config/index.js';

export async function generateReadme(projectRoot, config) {
  const dbUrl = getDatabaseUrlExample(config.database);

  const backendCmd = config.backend === 'nestjs' ? 'npm run dev' : 'npm run dev';
  const backendStart = config.backend === 'nestjs' ? 'npm run build && npm start' : 'npm start';

  let ormSetup = '';
  if (config.orm === 'prisma') {
    ormSetup = `### Prisma Setup

1. Update \`DATABASE_URL\` in \`backend/.env\`.
2. Push schema to database:
   \`\`\`bash
   cd backend
   npx prisma db push
   # or generate client
   npx prisma generate
   \`\`\`
`;
  } else if (config.orm === 'sequelize') {
    ormSetup = `### Sequelize Setup

1. Update \`DATABASE_URL\` in \`backend/.env\`.
2. The backend will authenticate the connection on startup via \`src/config/database.${config.backend === 'nestjs' ? 'ts' : 'js'}\`.
3. Tables are created via \`sequelize.sync()\` or migrations (add as needed). Example model is in \`src/models/index.${config.backend === 'nestjs' ? 'ts' : 'js'}\`.
`;
  } else if (config.orm === 'drizzle') {
    ormSetup = `### Drizzle Setup

1. Update \`DATABASE_URL\` in \`backend/.env\`.
2. Generate and push migrations:
   \`\`\`bash
   cd backend
   npx drizzle-kit generate
   npx drizzle-kit push
   \`\`\`
   Schema is in \`src/db/schema.${config.backend === 'nestjs' ? 'ts' : 'js'}\`, DB client in \`src/db/index.${config.backend === 'nestjs' ? 'ts' : 'js'}\`.
`;
  }

  const baseName = path.basename(config.projectName);
  const content = `# ${baseName}

Generated with \`stackinit\`.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite (JavaScript) |
| Backend | ${displayBackend(config.backend)} |
| Database | ${displayDatabase(config.database)} |
| ORM | ${displayOrm(config.orm)} |

## Project Structure

\`\`\`
${baseName}/
├── frontend/          # React + Vite (JavaScript)
├── backend/           # ${displayBackend(config.backend)}
├── .gitignore
└── README.md
\`\`\`

## Prerequisites

- Node.js >= 18
- ${config.database === 'sqlite' ? 'No external database required (SQLite file)' : displayDatabase(config.database) + ' instance'}

## Setup

### 1. Environment Variables

Backend:

\`\`\`bash
cd backend
cp .env.example .env
# Edit .env and set DATABASE_URL
\`\`\`

Project root:

\`\`\`bash
cp .env.example .env
# Same DATABASE_URL content as backend/.env.example
\`\`\`

Required variable:

\`\`\`
DATABASE_URL="${dbUrl}"
\`\`\`

Frontend (optional):

\`\`\`bash
cd frontend
cp .env.example .env
# VITE_API_URL defaults to http://localhost:3000
\`\`\`

### 2. Install Dependencies

\`\`\`bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
\`\`\`

Or from project root after generation dependencies are auto-installed.

### 3. Database Setup

${ormSetup}
### 4. Start Backend

\`\`\`bash
cd backend
${backendCmd}
# Backend runs on http://localhost:3000
# Health check: http://localhost:3000/api/health
\`\`\`

For production:

\`\`\`bash
cd backend
${backendStart}
\`\`\`

### 5. Start Frontend

\`\`\`bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
\`\`\`

The frontend calls \`GET /api/health\` and displays backend reachability.

## API Endpoints

- Base URL: \`http://localhost:3000\`
- Health endpoint: \`GET /api/health\`

## Scripts

### Backend

| Script | Description |
|--------|-------------|
| \`npm run dev\` | Start with auto-reload (nodemon) |
| \`npm start\` | Start without auto-reload |

### Frontend

| Script | Description |
|--------|-------------|
| \`npm run dev\` | Vite dev server |
| \`npm run build\` | Production build |
| \`npm run preview\` | Preview production build |
`;

  await writeFile(path.join(projectRoot, 'README.md'), content);
}
