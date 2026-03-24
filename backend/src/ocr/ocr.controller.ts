import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { ExtractDateDto, ProcessReceiptDto } from './dto';
import { OcrService } from './ocr.service';

@UseGuards(JwtGuard)
@Controller('ocr')
export class OcrController {
  constructor(private ocrService: OcrService) {}

  @Post('extract-date')
  async extractDate(@Body() dto: ExtractDateDto) {
    const detectedDate = await this.ocrService.extractDateFromImage(dto.base64Image);
    return { detectedDate };
  }

  @Post('process-receipt')
  async processReceipt(@Body() dto: ProcessReceiptDto) {
    const products = await this.ocrService.processReceipt(dto.base64Image);
    return { products };
  }
}
