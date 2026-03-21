import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getProductByBarcode(barcode: string) {
    // 1. Check local DB first
    const localProduct = await this.prisma.product.findUnique({
      where: { barcode },
    });
    if (localProduct) return localProduct;

    // 2. Fallback to OpenFoodFacts API
    try {
      const response = await axios.get(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      );

      if (response.data.status === 1) {
        const productData = response.data.product;
        
        // Save to local DB for future use
        const newProduct = await this.prisma.product.create({
          data: {
            barcode,
            name: productData.product_name || 'Unknown Product',
            brand: productData.brands || null,
            imageUrl: productData.image_url || null,
          },
        });
        return newProduct;
      } else {
        throw new NotFoundException('Product not found in OpenFoodFacts');
      }
    } catch (error) {
      // If network fails or product not found, just return what we have (or throw)
      throw new NotFoundException('Product not found');
    }
  }
}
