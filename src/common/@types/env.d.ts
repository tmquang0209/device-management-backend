declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    DIALECT:
      | 'mysql'
      | 'postgres'
      | 'sqlite'
      | 'mariadb'
      | 'mssql'
      | 'db2'
      | 'snowflake'
      | 'oracle';
    DATABASE_STORAGE: string;
    PORT: number;
    FALLBACK_LANGUAGE: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_DATABASE: string;
    SEEDING: 'true' | 'false';
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES_IN: string;
    JWT_AUDIENCE: string;
    JWT_ISSUER: string;
    MINIO_ENDPOINT: string;
    MINIO_PORT: string;
    MINIO_ACCESS_KEY: string;
    MINIO_SECRET_KEY: string;
    MINIO_BUCKET: string;
    MINIO_USE_SSL: 'true' | 'false';
    MINIO_REGION: string;
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD: string;
    REDIS_DB: number;
    CACHE_PREFIX: string;
    CACHE_TTL: number;
    CACHE_MAX: number;
    MAIL_HOST: string;
    MAIL_PORT: number;
    MAIL_USER: string;
    MAIL_PASSWORD: string;
    MAIL_FROM: string;
    MAIL_FROM_NAME: string;
    MAIL_FROM_ADDRESS: string;
  }
}
