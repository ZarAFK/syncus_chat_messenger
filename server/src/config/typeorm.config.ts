// src/config/typeorm.config.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as url from 'url';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

export default new DataSource(
  dbUrl
    ? {
        type: 'mysql',
        host: new url.URL(dbUrl).hostname,
        port: parseInt(new url.URL(dbUrl).port, 10),
        username: new url.URL(dbUrl).username,
        password: new url.URL(dbUrl).password,
        database: new url.URL(dbUrl).pathname.replace('/', ''),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      }
    : {
        type: 'mysql',
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '3306', 10),
        username: process.env.DB_USERNAME ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_NAME ?? 'test',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      },
);
