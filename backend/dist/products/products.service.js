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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const axios_1 = __importDefault(require("axios"));
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProductByBarcode(barcode) {
        const localProduct = await this.prisma.product.findUnique({
            where: { barcode },
        });
        if (localProduct)
            return localProduct;
        try {
            const response = await axios_1.default.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            if (response.data.status === 1) {
                const productData = response.data.product;
                const newProduct = await this.prisma.product.create({
                    data: {
                        barcode,
                        name: productData.product_name || 'Unknown Product',
                        brand: productData.brands || null,
                        imageUrl: productData.image_url || null,
                    },
                });
                return newProduct;
            }
            else {
                throw new common_1.NotFoundException('Product not found in OpenFoodFacts');
            }
        }
        catch (error) {
            throw new common_1.NotFoundException('Product not found');
        }
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map