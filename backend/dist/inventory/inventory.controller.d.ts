import { CreateInventoryItemDto, EditInventoryItemDto } from './dto';
import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private inventoryService;
    constructor(inventoryService: InventoryService);
    getInventory(userId: string): Promise<{
        id: string;
        userId: string;
        barcode: string;
        name: string;
        brand: string | null;
        imageUrl: string | null;
        expiryDate: Date;
        isExpired: boolean;
        addedAt: Date;
        updatedAt: Date;
    }[]>;
    getHistory(userId: string): Promise<{
        id: string;
        userId: string;
        barcode: string;
        name: string;
        brand: string | null;
        imageUrl: string | null;
        expiryDate: Date;
        isExpired: boolean;
        addedAt: Date;
        updatedAt: Date;
    }[]>;
    getItemById(userId: string, itemId: string): Promise<{
        id: string;
        userId: string;
        barcode: string;
        name: string;
        brand: string | null;
        imageUrl: string | null;
        expiryDate: Date;
        isExpired: boolean;
        addedAt: Date;
        updatedAt: Date;
    }>;
    createItem(userId: string, dto: CreateInventoryItemDto): Promise<{
        id: string;
        userId: string;
        barcode: string;
        name: string;
        brand: string | null;
        imageUrl: string | null;
        expiryDate: Date;
        isExpired: boolean;
        addedAt: Date;
        updatedAt: Date;
    }>;
    editItemById(userId: string, itemId: string, dto: EditInventoryItemDto): Promise<{
        id: string;
        userId: string;
        barcode: string;
        name: string;
        brand: string | null;
        imageUrl: string | null;
        expiryDate: Date;
        isExpired: boolean;
        addedAt: Date;
        updatedAt: Date;
    }>;
    deleteItemById(userId: string, itemId: string): Promise<void>;
}
