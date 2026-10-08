import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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

  // Normaliza todos los errores a la forma { error: { codigo, mensaje } }
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors();
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`MatchPlay API corriendo en http://localhost:${port}/api`);
}
bootstrap();
