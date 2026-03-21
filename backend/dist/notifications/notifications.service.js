"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const cron = __importStar(require("node-cron"));
const prisma_service_1 = require("../prisma/prisma.service");
const web_push_1 = __importDefault(require("web-push"));
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
        this.setupWebPush();
        cron.schedule('0 8 * * *', () => {
            this.logger.log('Running daily expiry check cron job');
            this.checkExpiringItems();
        });
    }
    setupWebPush() {
        try {
            web_push_1.default.setVapidDetails('mailto:contact@freshtrack.app', process.env.VAPID_PUBLIC_KEY || 'dummy_public_key', process.env.VAPID_PRIVATE_KEY || 'dummy_private_key');
        }
        catch (error) {
            this.logger.warn('VAPID keys are invalid or missing. Push notifications disabled.');
        }
    }
    async checkExpiringItems() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3);
        const expiringItems = await this.prisma.inventoryItem.findMany({
            where: {
                isExpired: false,
                OR: [
                    {
                        expiryDate: {
                            gte: today,
                            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                        },
                    },
                    {
                        expiryDate: {
                            gte: threeDaysFromNow,
                            lt: new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000),
                        },
                    },
                ],
            },
            include: { user: true },
        });
        for (const item of expiringItems) {
            const isToday = item.expiryDate.getTime() === today.getTime();
            const notificationType = isToday ? 'DAY_OF' : 'THREE_DAYS';
            const alreadySent = await this.prisma.notificationSent.findUnique({
                where: {
                    inventoryItemId_type: {
                        inventoryItemId: item.id,
                        type: notificationType,
                    },
                },
            });
            if (!alreadySent) {
                this.logger.log(`Item ${item.name} is expiring (${notificationType})! Notification sent to ${item.user.email}`);
                await this.prisma.notificationSent.create({
                    data: {
                        inventoryItemId: item.id,
                        type: notificationType,
                    },
                });
                if (isToday) {
                    await this.prisma.inventoryItem.update({
                        where: { id: item.id },
                        data: { isExpired: true },
                    });
                }
            }
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map