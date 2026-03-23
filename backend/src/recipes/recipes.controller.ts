import { Controller, Get, UseGuards } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';

@UseGuards(JwtGuard)
@Controller('recipes')
export class RecipesController {
  constructor(private recipesService: RecipesService) {}

  @Get('suggestions')
  getSuggestions(@GetUser('id') userId: string) {
    return this.recipesService.getAiSuggestions(userId);
  }
}
