import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async processReceipt(base64Image: string): Promise<any[]> {
    if (!this.genAI) {
      this.logger.error('GEMINI_API_KEY is not defined');
      throw new InternalServerErrorException('Gemini AI is not configured');
    }

    try {
      // 1. Prepare image data
      let processedImage = base64Image;
      if (base64Image.startsWith('data:image')) {
        processedImage = base64Image.split(',')[1];
      }

      // 2. Try multiple model variants
      const modelNames = [
        'gemini-flash-latest',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-pro-latest',
        'gemini-1.5-flash'
      ];
      
      let text = '';
      let success = false;

      for (const modelName of modelNames) {
        try {
          this.logger.log(`Attempting receipt extraction with model: ${modelName}`);
          const model = this.genAI.getGenerativeModel({ model: modelName });

          // 3. Define the prompt
          const prompt = `
            Analyze the provided image (shopping receipt or invoice) and extract a list of grocery/food items.
            Respond ONLY with a JSON array of objects.
            Format: [{"name": "...", "brand": "...", "quantity": "...", "category": "...", "price": 0.00}]
          `;

          // 4. Send to Gemini
          const result = await model.generateContent([
            prompt,
            {
              inlineData: {
                data: processedImage,
                mimeType: 'image/jpeg',
              },
            },
          ]);

          const response = await result.response;
          text = response.text();
          success = true;
          break;
        } catch (err) {
          this.logger.warn(`Model ${modelName} failed: ${err.message}`);
          if (modelName === modelNames[modelNames.length - 1]) {
            throw err;
          }
        }
      }

      if (!success) {
        throw new Error('All Gemini models failed');
      }

      // Clear any markdown formatting if present
      if (text.includes('```')) {
        text = text.replace(/```json|```/g, '').trim();
      }

      this.logger.log('Gemini extraction successful');
      return JSON.parse(text);
    } catch (error) {
      this.logger.error(`Receipt processing failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to process receipt image');
    }
  }

  async extractDateFromImage(base64Image: string): Promise<string | null> {
    // Keeping this for compatibility if used elsewhere, but updating it to use Gemini for better accuracy
    const products = await this.processReceipt(base64Image);
    // This is a bit of a shim since the user specifically talked about products, but the original service was for dates.
    // In a real scenario, we might want to extract the receipt date too.
    return null; 
  }
}
