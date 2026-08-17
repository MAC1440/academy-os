import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Two-million-character notes can approach 8 MB when the text contains
  // four-byte Unicode characters. Keep a small allowance for JSON metadata.
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // CORS configuration (allow all by default for dev, configurable via ALLOWED_ORIGINS env)
  const rawOrigins = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN;
  const allowedOrigins = rawOrigins
    ? rawOrigins.split(',').map((origin) => origin.trim())
    : '*';

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger OpenAPI Documentation setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AcademyOS API')
    .setDescription('Enterprise-grade Academy Management Platform API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT Bearer token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 AcademyOS API is running on: http://localhost:${port}`);
  console.log(
    `📚 Swagger documentation available at: http://localhost:${port}/docs`,
  );
}
void bootstrap();
