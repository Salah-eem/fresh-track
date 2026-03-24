import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';

@Module({
  imports: [ConfigModule],
  providers: [OcrService],
  controllers: [OcrController]
})
export class OcrModule {}
