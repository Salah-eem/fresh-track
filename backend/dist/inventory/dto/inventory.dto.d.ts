export declare class CreateInventoryItemDto {
    barcode: string;
    name: string;
    brand?: string;
    imageUrl?: string;
    expiryDate: string;
}
export declare class EditInventoryItemDto {
    name?: string;
    expiryDate?: string;
    isExpired?: boolean;
}
