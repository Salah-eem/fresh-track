import { PrismaService } from '../prisma/prisma.service';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    getProductByBarcode(barcode: string): Promise<{
        name: string;
        createdAt: Date;
        updatedAt: Date;
        barcode: string;
        brand: string | null;
        imageUrl: string | null;
    }>;
}
