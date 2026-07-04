import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as url from 'url';

export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbUrl = configService.get<string>('DATABASE_URL');

  if (dbUrl) {
    const parsedUrl = new url.URL(dbUrl);

    return {
      type: 'mysql',
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port, 10),
      username: parsedUrl.username,
      password: parsedUrl.password,
      database: parsedUrl.pathname.replace('/', ''),
      autoLoadEntities: true,
      synchronize: true,
    };
  }

  return {
    type: 'mysql',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: parseInt(configService.get<string>('DB_PORT', '3306'), 10),
    username: configService.get<string>('DB_USERNAME', 'root'),
    password: configService.get<string>('DB_PASSWORD', ''),
    database: configService.get<string>('DB_NAME', 'test'),
    autoLoadEntities: true,
    synchronize: true,
  };

};
