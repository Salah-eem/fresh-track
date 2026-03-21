"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getInventory(userId) {
        return this.prisma.inventoryItem.findMany({
            where: {
                userId,
                isExpired: false,
            },
            orderBy: { expiryDate: 'asc' },
        });
    }
    async getHistory(userId) {
        return this.prisma.inventoryItem.findMany({
            where: {
                userId,
                isExpired: true,
            },
            orderBy: { expiryDate: 'desc' },
        });
    }
    async getItemById(userId, itemId) {
        const item = await this.prisma.inventoryItem.findFirst({
            where: { id: itemId, userId },
        });
        if (!item)
            throw new common_1.ForbiddenException('Access denied');
        return item;
    }
    async createItem(userId, dto) {
        const isExpired = new Date(dto.expiryDate) < new Date();
        const item = await this.prisma.inventoryItem.create({
            data: {
                userId,
                barcode: dto.barcode,
                name: dto.name,
                brand: dto.brand,
                imageUrl: dto.imageUrl,
                expiryDate: new Date(dto.expiryDate),
                isExpired,
            },
        });
        return item;
    }
    async editItemById(userId, itemId, dto) {
        const item = await this.prisma.inventoryItem.findUnique({
            where: { id: itemId },
        });
        if (!item || item.userId !== userId) {
            throw new common_1.ForbiddenException('Access to resources denied');
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
    async deleteItemById(userId, itemId) {
        const item = await this.prisma.inventoryItem.findUnique({
            where: { id: itemId },
        });
        if (!item || item.userId !== userId) {
            throw new common_1.ForbiddenException('Access to resources denied');
        }
        await this.prisma.inventoryItem.delete({
            where: { id: itemId },
        });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map