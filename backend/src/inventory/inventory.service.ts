import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryItemDto, EditInventoryItemDto } from './dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getInventory(userId: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        userId,
        isExpired: false,
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async getHistory(userId: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        userId,
        isExpired: true,
      },
      orderBy: { expiryDate: 'desc' },
    });
  }

  async getItemById(userId: string, itemId: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!item) throw new ForbiddenException('Access denied');
    return item;
  }

  async createItem(userId: string, dto: CreateInventoryItemDto) {
    const isExpired = new Date(dto.expiryDate) < new Date();

    const item = await this.prisma.inventoryItem.create({
      data: {
        userId,
        barcode: dto.barcode || null,
        name: dto.name,
        brand: dto.brand || null,
        imageUrl: dto.imageUrl || null,
        expiryDate: new Date(dto.expiryDate),
        isExpired,
      },
    });
    return item;
  }

  async editItemById(userId: string, itemId: string, dto: EditInventoryItemDto) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.userId !== userId) {
      throw new ForbiddenException('Access to resources denied');
    }

    if (dto.expiryDate) {
      const isExpired = new Date(dto.expiryDate) < new Date();
      dto.isExpired = isExpired;
    }


    return this.prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        ...dto,
        ...(dto.expiryDate && { expiryDate: new Date(dto.expiryDate) }),
      },
    });
  }

  async deleteItemById(userId: string, itemId: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.userId !== userId) {
      throw new ForbiddenException('Access to resources denied');
    }

    await this.prisma.inventoryItem.delete({
      where: { id: itemId },
    });
  }
}
