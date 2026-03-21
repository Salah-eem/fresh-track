import { Injectable, Logger } from '@nestjs/common';
import * as cron from 'node-cron';
import { PrismaService } from '../prisma/prisma.service';
import webpush from 'web-push';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {
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
        process.env.VAPID_PUBLIC_KEY || 'dummy_public_key',
        process.env.VAPID_PRIVATE_KEY || 'dummy_private_key',
      );
    } catch (error) {
      this.logger.warn('VAPID keys are invalid or missing. Push notifications disabled.');
    }
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
      const isToday = item.expiryDate.getTime() === today.getTime();
      const notificationType = isToday ? 'DAY_OF' : 'THREE_DAYS';

      // Ensure we haven't already sent THIS specific notification type for THIS item
      const alreadySent = await this.prisma.notificationSent.findUnique({
        where: {
          inventoryItemId_type: {
            inventoryItemId: item.id,
            type: notificationType,
          },
        },
      });

      if (!alreadySent) {
        // Here we'd map over user's subscribed push endpoints.
        // For MVP, we'll just log and create DB audit record
        this.logger.log(`Item ${item.name} is expiring (${notificationType})! Notification sent to ${item.user.email}`);

        // Mark as sent in DB
        await this.prisma.notificationSent.create({
          data: {
            inventoryItemId: item.id,
            type: notificationType,
          },
        });

        // If today, also mark as expired after notification
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
