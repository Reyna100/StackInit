import path from 'path';
import { writeFile } from '../../utils/helpers.js';

function getBackendDeps(orm, database) {
  const deps = {
    '@nestjs/common': '^10.3.0',
    '@nestjs/core': '^10.3.0',
    '@nestjs/platform-express': '^10.3.0',
    'reflect-metadata': '^0.2.1',
    rxjs: '^7.8.1',
    cors: '^2.8.5',
    dotenv: '^16.3.1',
  };
  if (orm === 'prisma') deps['@prisma/client'] = '^5.10.0';
  else if (orm === 'sequelize') {
    deps['sequelize'] = '^6.37.0';
    if (database === 'mysql') deps['mysql2'] = '^3.9.0';
    else if (database === 'postgresql') { deps['pg'] = '^8.11.0'; deps['pg-hstore'] = '^2.3.4'; }
    else if (database === 'sqlite') deps['sqlite3'] = '^5.1.7';
  } else if (orm === 'drizzle') {
    deps['drizzle-orm'] = '^0.30.0';
    if (database === 'mysql') deps['mysql2'] = '^3.9.0';
    else if (database === 'postgresql') deps['pg'] = '^8.11.0';
    else if (database === 'sqlite') deps['better-sqlite3'] = '^9.1.0';
  }
  return deps;
}

function getDevDeps(orm) {
  const dev = {
    '@nestjs/cli': '^10.3.0',
    '@nestjs/schematics': '^10.1.0',
    typescript: '^5.3.0',
    'ts-node': '^10.9.0',
    nodemon: '^3.0.3',
  };
  if (orm === 'prisma') dev['prisma'] = '^5.10.0';
  if (orm === 'drizzle') dev['drizzle-kit'] = '^0.20.0';
  return dev;
}

export async function generateNestjsBackend(projectRoot, config) {
  const backendDir = path.join(projectRoot, 'backend');
  const deps = getBackendDeps(config.orm, config.database);
  const devDeps = getDevDeps(config.orm);

  const baseName = path.basename(config.projectName);
  await writeFile(
    path.join(backendDir, 'package.json'),
    JSON.stringify(
      {
        name: `${baseName}-backend`,
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'nodemon',
          start: 'node dist/main.js',
          build: 'nest build',
        },
        dependencies: deps,
        devDependencies: devDeps,
      },
      null,
      2
    ) + '\n'
  );

  // nest-cli.json
  await writeFile(
    path.join(backendDir, 'nest-cli.json'),
    JSON.stringify(
      {
        collection: '@nestjs/schematics',
        sourceRoot: 'src',
        compilerOptions: {
          deleteOutDir: true,
        },
      },
      null,
      2
    ) + '\n'
  );

  // tsconfig.json
  await writeFile(
    path.join(backendDir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          module: 'commonjs',
          target: 'ES2022',
          lib: ['ES2022'],
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          resolveJsonModule: true,
          declaration: true,
          sourceMap: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2
    ) + '\n'
  );

  // nodemon.json
  await writeFile(
    path.join(backendDir, 'nodemon.json'),
    JSON.stringify(
      {
        watch: ['src'],
        ext: 'ts',
        exec: 'ts-node src/main.ts',
      },
      null,
      2
    ) + '\n'
  );

  // src/main.ts
  await writeFile(
    path.join(backendDir, 'src/main.ts'),
    `import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  });
  app.setGlobalPrefix('api');
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(\`Server running on http://localhost:\${port}\`);
}
bootstrap();
`
  );

  // src/app.module.ts
  await writeFile(
    path.join(backendDir, 'src/app.module.ts'),
    `import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
${config.orm === 'sequelize' ? `import { DatabaseModule } from './config/database.module';` : ''}
${config.orm === 'prisma' ? `import { PrismaModule } from './prisma/prisma.module';` : ''}
${config.orm === 'drizzle' ? `import { DrizzleModule } from './db/drizzle.module';` : ''}

@Module({
  imports: [HealthModule${config.orm === 'sequelize' ? ', DatabaseModule' : ''}${config.orm === 'prisma' ? ', PrismaModule' : ''}${config.orm === 'drizzle' ? ', DrizzleModule' : ''}],
})
export class AppModule {}
`
  );

  // health module
  await writeFile(
    path.join(backendDir, 'src/health/health.controller.ts'),
    `import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
`
  );

  await writeFile(
    path.join(backendDir, 'src/health/health.module.ts'),
    `import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
`
  );

  // ORM-specific: add database module placeholders
  if (config.orm === 'sequelize') {
    await writeFile(
      path.join(backendDir, 'src/config/database.module.ts'),
      `import { Module } from '@nestjs/common';
import { sequelize } from './database';

@Module({
  providers: [
    {
      provide: 'SEQUELIZE',
      useValue: sequelize,
    },
  ],
  exports: ['SEQUELIZE'],
})
export class DatabaseModule {
  constructor() {
    sequelize
      .authenticate()
      .then(() => console.log('Database connection established'))
      .catch((err: Error) => console.error('Unable to connect to database:', err.message));
  }
}
`
    );
  }

  if (config.orm === 'prisma') {
    await writeFile(
      path.join(backendDir, 'src/prisma/prisma.service.ts'),
      `import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Database connected (Prisma)');
    } catch (err: any) {
      console.error('Prisma connection error:', err.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
`
    );

    await writeFile(
      path.join(backendDir, 'src/prisma/prisma.module.ts'),
      `import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
`
    );
  }

  if (config.orm === 'drizzle') {
    await writeFile(
      path.join(backendDir, 'src/db/drizzle.module.ts'),
      `import { Module, Global } from '@nestjs/common';
import { db } from './index';

@Global()
@Module({
  providers: [{ provide: 'DRIZZLE_DB', useValue: db }],
  exports: ['DRIZZLE_DB'],
})
export class DrizzleModule {
  constructor() {
    console.log('Database client initialized (Drizzle)');
  }
}
`
    );
  }
}
