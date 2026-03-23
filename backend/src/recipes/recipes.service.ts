import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);
  private genAI: GoogleGenerativeAI;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async getAiSuggestions(userId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { userId },
      select: { name: true, brand: true },
    });

    if (items.length === 0) {
      return [];
    }

    const ingredients = items.map((i) => i.name).join(', ');
    
    if (!this.genAI) {
      this.logger.warn('GEMINI_API_KEY not found. Using fallback mock suggestions.');
      return this.getMockSuggestions(ingredients);
    }

    // Try multiple model variants in case one is restricted or not found
    const modelNames = [
      'gemini-flash-latest',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-pro-latest',
      'gemini-1.5-flash'
    ];
    
    for (const modelName of modelNames) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const prompt = `
          You are a chef assistant for an app called FreshTrack.
          Based on these ingredients available in the user's fridge: [${ingredients}].
          Suggest 3 creative and varied recipes.
          
          Respond ONLY with a JSON array. DO NOT use markdown code blocks (\`\`\`json).
          Follow this structure exactly:
          [{
            "id": "unique-id",
            "title": "Recipe Title",
            "image": "Unsplash URL",
            "readyInMinutes": 20,
            "ingredients": ["item1", "item2"],
            "instructions": ["Step 1", "Step 2"]
          }]
        `;

        this.logger.log(`Attempting Gemini call with model: ${modelName}`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Robust JSON extraction in case the model uses markdown blocks despite instructions
        if (text.includes('```')) {
          text = text.replace(/```json|```/g, '').trim();
        }

        return JSON.parse(text);
      } catch (error) {
        this.logger.warn(`Failed with model ${modelName}: ${error.message}`);
        // If it's the last model, try to use mock fallback
        if (modelName === modelNames[modelNames.length - 1]) {
          this.logger.error('All Gemini models failed. Using mock fallback.');
          return this.getMockSuggestions(ingredients);
        }
      }
    }
  }

  private getMockSuggestions(ingredients: string) {
    // Fallback if API key is missing or calls fail
    return [
      {
        id: 'mock-1',
        title: 'Quick Chef Special',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400',
        readyInMinutes: 15,
        ingredients: ingredients.split(', '),
        instructions: ['Prepare your fresh ingredients.', 'Season to taste.', 'Cook thoroughly and enjoy.']
      }
    ];
  }
}

