import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Valida automáticamente los DTOs de entrada contra los decoradores de class-validator
  // y elimina cualquier propiedad que no esté declarada en el DTO.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Normaliza todos los errores a la forma { error: { codigo, mensaje } } del schema `Error`.
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors();
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('MatchPlay API')
    .setDescription(
      'API para MatchPlay, una app de matchmaking deportivo para encontrar compañeros y partidos de fútbol, básquet, tenis, ciclismo, pádel y vóleibol.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`MatchPlay API corriendo en http://localhost:${port}/api`);
  // eslint-disable-next-line no-console
  console.log(`Documentación Swagger en http://localhost:${port}/api/docs`);
}
bootstrap();
