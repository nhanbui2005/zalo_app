import { ApiModule } from '@/api/api.module';
import authConfig from '@/api/auth/config/auth.config';
import { BackgroundModule } from '@/background/background.module';
import appConfig from '@/config/app.config';
import mailConfig from '@/mail/config/mail.config';
import redisConfig from '@/redis/config/redis.config';
import { BullModule } from '@nestjs/bullmq';
import databaseConfig from '@/database/config/database.config';
import { TypeOrmConfigService } from '@/database/typeorm-config.service';
import { ModuleMetadata } from '@nestjs/common';
import { ConfigModule, ConfigService, PathImpl2 } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AllConfigType } from '@/config/config.type';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { Environment } from '@/constants/app.constant';
import path from 'path';
import { LoggerModule } from 'nestjs-pino';
import loggerFactory from './logger-factory';
import { MailModule } from '@/mail/mail.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventsModule } from 'src/events/events.module';
import { RedisModule } from '@/redis/redis.module';

function generateModulesSet() {
  const imports: ModuleMetadata['imports'] = [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig, 
        authConfig, 
        mailConfig
      ],
      envFilePath: ['.env'],
    }),
    EventsModule
  ];
  let customModules: ModuleMetadata['imports'] = [];
  const dbModule = TypeOrmModule.forRootAsync({
    useClass: TypeOrmConfigService,
    dataSourceFactory: async (options: DataSourceOptions) => {
      if (!options) {
        throw new Error('Invalid options passed');
      }

      return new DataSource(options).initialize();
    },
  })

  const bullModule = BullModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: (configService: ConfigService<AllConfigType>) => ({
      connection: {
        host: configService.getOrThrow('redis.host', { infer: true }),
        port: parseInt(configService.getOrThrow('redis.port', { infer: true })),
        password: configService.get('redis.password', { infer: true }) || undefined,
        tls: configService.get('redis.tlsEnabled', { infer: true }) ? {} : undefined,
      },
    }),
    inject: [ConfigService],
  });

  const i18nModule = I18nModule.forRootAsync({
    resolvers: [
      { use: QueryResolver, options: ['lang'] },
      AcceptLanguageResolver,
      new HeaderResolver(['x-lang']),
    ],
    useFactory: (configService: ConfigService<AllConfigType>) => {
      const env = configService.get('app.nodeEnv', { infer: true });
      const isLocal = env === Environment.LOCAL;
      const isDevelopment = env === Environment.DEVELOPMENT;
      return {
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loaderOptions: {
          path: path.join(__dirname, '/../i18n/'),
          watch: isLocal,
        },
        typesOutputPath: path.join(
          __dirname,
          '../../src/generated/i18n.generated.ts',
        ),
        logging: isLocal || isDevelopment, // log info on missing keys
      };
    },
    inject: [ConfigService],
  });

  const loggerModule = LoggerModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: loggerFactory,
  });



  const modulesSet = process.env.MODULES_SET || 'monolith';

  switch (modulesSet) {
    case 'monolith': //tất cả các module
      customModules = [
        ApiModule,
        bullModule,
        BackgroundModule,
        dbModule,
        i18nModule,
        loggerModule,
        MailModule,
        EventEmitterModule.forRoot(),
        EventsModule,
        RedisModule,

      ];
      break;
    case 'api': //không có background module
      customModules = [
        ApiModule,
        bullModule,
        dbModule,
        i18nModule,
        loggerModule,
        MailModule,
        EventEmitterModule.forRoot(),
        EventsModule,
        RedisModule,
      ];
      break;
    case 'background'://không có api module và mail module
      customModules = [
        bullModule,
        BackgroundModule,
        dbModule,
        i18nModule,
        loggerModule,
        EventEmitterModule.forRoot(),
        EventsModule,
        RedisModule,

      ];
      break;
    default:
      console.error(`Unsupported modules set: ${modulesSet}`);
      break;
  }

  return imports.concat(customModules);
}

export default generateModulesSet;
