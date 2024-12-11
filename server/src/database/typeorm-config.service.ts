// import TypeOrmCustomLogger from '@/utils/typeorm-custom-logger';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService<AllConfigType>) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: this.configService.get('database.type', { infer: true }) || 'postgres',
      host: this.configService.get('database.host', { infer: true }) || 'localhost',
      port: this.configService.get('database.port', { infer: true }) || 5432,
      username: this.configService.get('database.username', { infer: true }) || 'postgres',
      password: this.configService.get('database.password', { infer: true }) || '091717',
      database: this.configService.get('database.name', { infer: true }) || 'postgres',
      synchronize: this.configService.get('database.synchronize', {
        infer: true,
      }),
      extra:{
        keepAlive: true,
        idleTimeoutMillis: 30000, // thời gian chờ kết nối
        connectionTimeoutMillis: 30000,
        max:10
      },
      dropSchema: false,
      keepConnectionAlive: true,
      // logger: TypeOrmCustomLogger.getInstance(
      //   'default',
      //   this.configService.get('database.logging', { infer: true })
      //     ? ['error', 'warn', 'query', 'schema']
      //     : ['error', 'warn'],
      // ),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
      migrationsTableName: 'migrations',
      poolSize: this.configService.get('database.maxConnections', {
        infer: true,
      }),
      ssl: this.configService.get('database.sslEnabled', { infer: true })
        ? {
            rejectUnauthorized: this.configService.get(
              'database.rejectUnauthorized',
              { infer: true },
            ),
            ca:
              this.configService.get('database.ca', { infer: true }) ??
              undefined,
            key:
              this.configService.get('database.key', { infer: true }) ??
              undefined,
            cert:
              this.configService.get('database.cert', { infer: true }) ??
              undefined,
          }
        : undefined,
    } as TypeOrmModuleOptions;
  }
}
