import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';

@Injectable()
export class OcrService {
  async extractDateFromImage(base64Image: string): Promise<string | null> {
    try {
      // 1. Convert base64 to buffer if needed, but Tesseract accepts valid data URIs
      // Ensure the string has the data prefix, or it's just raw base64
      let processedImage = base64Image;
      if (!base64Image.startsWith('data:image')) {
        processedImage = `data:image/jpeg;base64,${base64Image}`;
      }

      // 2. Run OCR using tesseract.js worker
      const worker = await Tesseract.createWorker('eng');
      const {
        data: { text },
      } = await worker.recognize(processedImage);
      await worker.terminate();

      // 3. Parse the date from the extracted text
      return this.parseDate(text);
    } catch (error) {
      throw new InternalServerErrorException('Failed to process image');
    }
  }

  private parseDate(text: string): string | null {
    // Basic regex for dates (DD/MM/YY, DD/MM/YYYY, MM/YY, YYYY-MM-DD, etc.)
    // A comprehensive production app would use NLP or robust date parsing libraries like `chrono-node`
    // This looks for standard EU/UK formats DD/MM/YYYY or DD-MM-YYYY
    const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/;
    const match = text.match(dateRegex);

    if (match) {
      let [_, day, month, year] = match;

      // Handle 2-digit years
      if (year.length === 2) {
        year = `20${year}`;
      }

      // Format to standard ISO string (YYYY-MM-DD) for database ease
      const paddedDay = day.padStart(2, '0');
      const paddedMonth = month.padStart(2, '0');

      return `${year}-${paddedMonth}-${paddedDay}`;
    }

    return null; // Return null if no valid date found
  }
}
