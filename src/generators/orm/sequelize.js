import path from 'path';
import { writeFile } from '../../utils/helpers.js';

function sequelizeConfigContent(database) {
  if (database === 'sqlite') {
    return `import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace('file:', '') : './dev.db',
  logging: false,
});
`;
  }

  // mysql / postgresql use DATABASE_URL
  return `import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: '${database === 'mysql' ? 'mysql' : 'postgres'}',
  logging: false,
});
`;
}

function sequelizeConfigContentTS(database) {
  if (database === 'sqlite') {
    return `import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace('file:', '') : './dev.db',
  logging: false,
});
`;
  }
  return `import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: '${database === 'mysql' ? 'mysql' : 'postgres'}',
  logging: false,
});
`;
}

export async function generateSequelizeOrm(projectRoot, config) {
  const backendDir = path.join(projectRoot, 'backend');
  const isNest = config.backend === 'nestjs';
  const ext = isNest ? 'ts' : 'js';
  const content = isNest ? sequelizeConfigContentTS(config.database) : sequelizeConfigContent(config.database);

  // src/config/database.js|ts
  await writeFile(path.join(backendDir, `src/config/database.${ext}`), content);

  // src/models/index.js|ts - example model
  const sequelizeImport = isNest ? '../config/database' : '../config/database.js';
  const modelContent = isNest
    ? `import { DataTypes } from 'sequelize';
import { sequelize } from '${sequelizeImport}';

export const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'users',
  timestamps: true,
});
`
    : `import { DataTypes } from 'sequelize';
import { sequelize } from '${sequelizeImport}';

export const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'users',
  timestamps: true,
});
`;

  await writeFile(path.join(backendDir, `src/models/index.${ext}`), modelContent);

  // Add sync helper comment in .sequelizerc alternative - not needed
}
