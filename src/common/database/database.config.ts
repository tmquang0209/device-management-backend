import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { Dialect } from 'sequelize';

export const databaseConfig = (): SequelizeModuleOptions => {
  const dialect = process.env.DIALECT as Dialect;
  if (dialect === 'sqlite') {
    return {
      dialect: 'sqlite',
      storage: process.env.DATABASE_STORAGE || ':memory:',
      autoLoadModels: true,
      synchronize: true,
      logging: false,
    };
  } else if (dialect === 'postgres') {
    return {
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadModels: true,
      synchronize: true,
      logging: false,
      ...(process.env.NODE_ENV !== 'development' && {
        dialectOptions: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
      }),
    };
  } else if (dialect === 'mysql') {
    return {
      dialect: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      // models: [PermissionEntity, RolePermissionsEntity, RoleEntity, UserEntity],
      autoLoadModels: true,
      synchronize: true,
      logging: false,
      ...(process.env.NODE_ENV !== 'development' && {
        dialectOptions: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
      }),
    };
  }
  throw new Error(`Unsupported database dialect: ${dialect}`);
};
