import { ProductsService } from './products.service';
export declare class ProductsController {
    private productsService;
    constructor(productsService: ProductsService);
    getProductByBarcode(ean: string): Promise<{
        name: string;
        createdAt: Date;
        updatedAt: Date;
        barcode: string;
        brand: string | null;
        imageUrl: string | null;
    }>;
}
