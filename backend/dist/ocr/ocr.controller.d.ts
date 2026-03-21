import { ExtractDateDto } from './dto';
import { OcrService } from './ocr.service';
export declare class OcrController {
    private ocrService;
    constructor(ocrService: OcrService);
    extractDate(dto: ExtractDateDto): Promise<{
        detectedDate: string | null;
    }>;
}
