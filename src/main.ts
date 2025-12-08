import { HttpExceptionFilter } from '@common/filters';
import { JwtGuard, PermissionGuard } from '@common/guards';
import { TransformationInterceptor } from '@common/interceptor';
import { getQueueToken } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { AppModule } from './app.module';
import { setupBullBoard } from './bull-board';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const mailQueueInstance = app.get(getQueueToken('mail'));
  // Setup Bull Board
  setupBullBoard(app, [mailQueueInstance]);

  const reflector = app.get(Reflector);

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:4000', 'https://fe-codebase.tmquang.com'],
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      stopAtFirstError: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      detailedErrors: false,
    }),
  );
  app.useGlobalGuards(new JwtGuard(reflector));
  app.useGlobalGuards(new PermissionGuard(reflector));

  app.useGlobalInterceptors(new TransformationInterceptor(reflector));

  const swgBuilder = new DocumentBuilder()
    .setTitle('Server API docs')
    .addBearerAuth();

  const swaggerDocument = SwaggerModule.createDocument(app, swgBuilder.build());
  SwaggerModule.setup('api', app, swaggerDocument, {
    jsonDocumentUrl: 'api-json',
  });

  await app.listen(process.env.PORT ?? 3000, () => {
    Logger.log(`Server is running on port ${process.env.PORT ?? 3000}`);
  });
}

void bootstrap();
