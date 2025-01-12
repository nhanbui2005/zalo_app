// import { NestFactory, Reflector } from '@nestjs/core';
// import { AppModule } from './app.module';
// import helmet from 'helmet';
// import { ConfigService, PathImpl2 } from '@nestjs/config';
// import { type AllConfigType } from './config/config.type';
// import { ClassSerializerInterceptor, HttpStatus, RequestMethod, UnprocessableEntityException, ValidationError, ValidationPipe, VersioningType } from '@nestjs/common';
// import { AuthService } from './api/auth/auth.service';
// import { AuthGuard } from './api/guards/auth.guard';
// import { GlobalExceptionFilter } from './api/filters/global-exception.filter';
// import setupSwagger from './utils/setup-swagger';

import {
  ClassSerializerInterceptor,
  HttpStatus,
  RequestMethod,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AuthService } from './api/auth/auth.service';
import { AppModule } from './app.module';
import { type AllConfigType } from './config/config.type';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { AuthGuard } from './guards/auth.guard';
import setupSwagger from './utils/setup-swagger';
import { RolesGuard } from './guards/roles.guard';
import { WsGuard } from './guards/ws.guard';
import { WsAdapter } from './WsAdapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {bufferLogs: true});

  app.useLogger(app.get(Logger))
  app.use(helmet());
  app.use(compression());

  const configService = app.get(ConfigService<AllConfigType>);
  const reflector = app.get(Reflector);
  const isDevelopment = configService.getOrThrow('app.nodeEnv', { infer: true }) === 'development';
  const corsOrigin = configService.getOrThrow('app.corsOrigin', {
    infer: true,
  });
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });
  console.info('CORS Origin:', corsOrigin);
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: [
        { method: RequestMethod.GET, path: '/' },
        { method: RequestMethod.GET, path: 'health' },
      ],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
    prefix:'v'
  });

  app.useGlobalGuards(
    new AuthGuard(reflector, app.get(AuthService)),
    new RolesGuard(reflector),
    // new WsGuard(reflector, app.get(AuthService))
  );
  // app.useWebSocketAdapter(new WsAdapter(app.get(AuthService)));
  // app.useWebSocketAdapter(new WsGuard(reflector, app.get(AuthService)));
  app.useGlobalFilters(new GlobalExceptionFilter(configService));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: (errors: ValidationError[]) => {
        return new UnprocessableEntityException(errors);
      },
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  if (isDevelopment) {
    setupSwagger(app);
  }

  await app.listen(configService.getOrThrow('app.port', { infer: true }));

  console.info(`Server running on ${await app.getUrl()}`);

  return app
}
void bootstrap();
