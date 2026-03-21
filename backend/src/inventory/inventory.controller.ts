import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';
import { CreateInventoryItemDto, EditInventoryItemDto } from './dto';
import { InventoryService } from './inventory.service';

@UseGuards(JwtGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  getInventory(@GetUser('id') userId: string) {
    return this.inventoryService.getInventory(userId);
  }

  @Get('history')
  getHistory(@GetUser('id') userId: string) {
    return this.inventoryService.getHistory(userId);
  }

  @Get(':id')
  getItemById(@GetUser('id') userId: string, @Param('id') itemId: string) {
    return this.inventoryService.getItemById(userId, itemId);
  }

  @Post()
  createItem(@GetUser('id') userId: string, @Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.createItem(userId, dto);
  }

  @Patch(':id')
  editItemById(
    @GetUser('id') userId: string,
    @Param('id') itemId: string,
    @Body() dto: EditInventoryItemDto,
  ) {
    return this.inventoryService.editItemById(userId, itemId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteItemById(@GetUser('id') userId: string, @Param('id') itemId: string) {
    return this.inventoryService.deleteItemById(userId, itemId);
  }
}
