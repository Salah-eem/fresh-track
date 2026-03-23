import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable global validation with class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip undefined properties
    }),
  );
  
  // Enable CORS for frontend connection
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000' || 'https://fresh-track-chi.vercel.app',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  const url = await app.getUrl();
  console.log(`Application is running on: ${url}`);
}
bootstrap();
