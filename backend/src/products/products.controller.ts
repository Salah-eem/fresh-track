import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { ProductsService } from './products.service';

@UseGuards(JwtGuard)
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get('barcode/:ean')
  getProductByBarcode(@Param('ean') ean: string) {
    return this.productsService.getProductByBarcode(ean);
  }
}
