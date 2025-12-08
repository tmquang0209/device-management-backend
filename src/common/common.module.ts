import { createKeyv } from '@keyv/redis';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CacheableMemory } from 'cacheable';
import { default as IORedis, default as Redis } from 'ioredis';
import * as Joi from 'joi';
import Keyv from 'keyv';
import { ClsModule } from 'nestjs-cls';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.valid('development', 'production', 'test').required(),
        DIALECT: Joi.string().valid(
          'mysql',
          'postgres',
          'sqlite',
          'mariadb',
          'mssql',
          'db2',
          'snowflake',
          'oracle',
        ),
        DATABASE_STORAGE: Joi.string().allow('').when('DIALECT', {
          is: 'sqlite',
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        PORT: Joi.number().default(3001),
        FALLBACK_LANGUAGE: Joi.string().default('vi'),
        DB_HOST: Joi.string().when('DIALECT', {
          is: Joi.valid(
            'mysql',
            'postgres',
            'mariadb',
            'mssql',
            'db2',
            'snowflake',
            'oracle',
          ),
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        DB_PORT: Joi.number().when('DIALECT', {
          is: Joi.valid(
            'mysql',
            'postgres',
            'mariadb',
            'mssql',
            'db2',
            'snowflake',
            'oracle',
          ),
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        DB_USERNAME: Joi.string().when('DIALECT', {
          is: Joi.valid(
            'mysql',
            'postgres',
            'mariadb',
            'mssql',
            'db2',
            'snowflake',
            'oracle',
          ),
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        DB_PASSWORD: Joi.string().allow('').optional(),
        DB_DATABASE: Joi.string().when('DIALECT', {
          is: Joi.valid(
            'mysql',
            'postgres',
            'mariadb',
            'mssql',
            'db2',
            'snowflake',
            'oracle',
          ),
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
        SEEDING: Joi.string().valid('true', 'false').default('false'),
        JWT_SECRET: Joi.string().min(6).required(),
        JWT_EXPIRES_IN: Joi.string().default('1h'),
        JWT_REFRESH_SECRET: Joi.string().min(6).required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
        JWT_AUDIENCE: Joi.string().optional(),
        JWT_ISSUER: Joi.string().optional(),
        MINIO_ENDPOINT: Joi.string().allow('').optional(),
        MINIO_PORT: Joi.string().allow('').optional(),
        MINIO_ACCESS_KEY: Joi.string().allow('').optional(),
        MINIO_SECRET_KEY: Joi.string().allow('').optional(),
        MINIO_BUCKET: Joi.string().allow('').optional(),
        MINIO_USE_SSL: Joi.string().valid('true', 'false').default('false'),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_USERNAME: Joi.string().allow('').optional(),
        REDIS_PASSWORD: Joi.string().allow('').optional(),
        REDIS_DB: Joi.number().default(0),
        CACHE_PREFIX: Joi.string().default('cache'),
        CACHE_TTL: Joi.number().default(60000),
        CACHE_MAX: Joi.number().default(100),
        MAIL_HOST: Joi.string().required(),
        MAIL_PORT: Joi.number().required(),
        MAIL_USER: Joi.string().required(),
        MAIL_PASSWORD: Joi.string().required(),
        MAIL_FROM: Joi.string().email().required(),
        MAIL_FROM_NAME: Joi.string().optional(),
        MAIL_FROM_ADDRESS: Joi.string().email().optional(),
      }),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: process.env.JWT_TOKEN_EXPIRES },
      }),
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },
      defaults: {
        from: `"No Reply" <${process.env.MAIL_FROM}>`,
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new EjsAdapter(),
        options: {
          strict: false,
        },
      },
    }),
    CacheModule.registerAsync({
      useFactory: () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({
                ttl: Number(process.env.CACHE_TTL) || 60 * 1000, // default to 60 seconds
                lruSize: Number(process.env.CACHE_MAX) || 100,
              }),
            }),
            createKeyv({
              url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
              username: process.env.REDIS_USERNAME,
              password: process.env.REDIS_PASSWORD,
              database: Number(process.env.REDIS_DB) || 0,
            }),
          ],
          ttl: Number(process.env.CACHE_TTL) || 60 * 1000, // default to 60 seconds
        };
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          connection: {
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT') || 6379,
            username: configService.get<string>('REDIS_USERNAME'),
            password: configService.get<string>('REDIS_PASSWORD'),
            db: Number(process.env.REDIS_DB) || 0,
            name: process.env.CACHE_PREFIX || 'cache',
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: 'mail',
    }),
    I18nModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        fallbackLanguage: process.env.FALLBACK_LANGUAGE || 'vi',
        fallbacks: {
          'vi-*': 'vi',
          'en-*': 'en',
          vi: 'vi',
          en: 'en',
        },
        logging: true,
        loaderOptions: {
          path: join(__dirname, '../i18n'),
          watch: true,
          includeSubfolders: true,
        },
        typesOutputPath: join(
          __dirname,
          '../../src/generated/i18n.generated.ts',
        ),
      }),
      resolvers: [
        {
          use: QueryResolver,
          options: ['lang'],
        },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
      interceptor: { mount: true },
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        return new IORedis({
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT') ?? 6379,
          username: config.get<string>('REDIS_USERNAME'),
          password: config.get<string>('REDIS_PASSWORD'),
          db: config.get<number>('REDIS_DB') ?? 0,
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
        });
      },
    },
  ],
  exports: [
    ConfigModule,
    JwtModule,
    CacheModule,
    I18nModule,
    ClsModule,
    REDIS_CLIENT,
    BullModule,
  ],
})
export class CommonModule {}
