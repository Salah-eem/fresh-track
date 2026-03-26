import { Injectable, Logger, ConflictException } from '@nestjs/common';
import * as cron from 'node-cron';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as webpush from 'web-push';
import { PushSubscriptionDto } from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {
    this.setupWebPush();
    // Schedule task every day at 8:00 AM
    cron.schedule('0 8 * * *', () => {
      this.logger.log('Running daily expiry check cron job');
      this.checkExpiringItems();
    });
  }

  private setupWebPush() {
    try {
      webpush.setVapidDetails(
        'mailto:contact@freshtrack.app', // Should ideally be in env
        process.env.VAPID_PUBLIC_KEY || '',
        process.env.VAPID_PRIVATE_KEY || '',
      );
    } catch (error) {
      this.logger.warn('VAPID keys are invalid or missing. Push notifications disabled.');
    }
  }

  async subscribe(userId: string, dto: PushSubscriptionDto) {
    const existing = await this.prisma.pushSubscription.findUnique({
      where: { endpoint: dto.endpoint },
    });

    if (existing) {
      if (existing.userId === userId) return existing;
      // Re-assign subscription to new user if endpoint is same (unlikely but possible)
      return this.prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { userId },
      });
    }

    return this.prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
      },
    });
  }

  async checkExpiringItems() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    // Get items expiring in 3 days or exactly today that haven't been notified yet
    const expiringItems = await this.prisma.inventoryItem.findMany({
      where: {
        isExpired: false,
        OR: [
          {
            expiryDate: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Today
            },
          },
          {
            expiryDate: {
              gte: threeDaysFromNow,
              lt: new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000), // In 3 days
            },
          },
        ],
      },
      include: { user: true },
    });

    for (const item of expiringItems) {
      // Normalize expiryDate to midnight for comparison
      const itemExpiryDate = new Date(item.expiryDate);
      itemExpiryDate.setHours(0, 0, 0, 0);
      const isToday = itemExpiryDate.getTime() === today.getTime();
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
        // Calculate days until expiry
        const daysUntilExpiry = isToday ? 0 : 3;

        // Send Push Notifications
        const subscriptions = await this.prisma.pushSubscription.findMany({
          where: { userId: item.userId },
        });

        const payload = JSON.stringify({
          title: 'Alerte Expiration !',
          body: `${item.name} (${item.brand || ''}) s'expire ${isToday ? "aujourd'hui" : "dans 3 jours"}.`,
          icon: '/icon-192x192.png',
          data: {
            url: `/item/${item.id}`,
          },
        });

        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              payload,
            );
          } catch (error: any) {
            this.logger.error(`Failed to send push to ${sub.endpoint}: ${error.message}`, error.stack);
            if (error.statusCode === 410 || error.statusCode === 404) {
              await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
          }
        }

        // Send Email Notification
        try {
          await this.emailService.sendExpiryNotification(
            item.user.email,
            item.name,
            item.brand,
            item.expiryDate,
            daysUntilExpiry,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send expiry email to ${item.user.email}:`,
            error,
          );
        }

        this.logger.log(`Item ${item.name} is expiring (${notificationType})! Notifications sent (push + email).`);

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
}
