import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { NotificationsService } from './notifications.service';
import { PushSubscriptionDto } from './dto/notifications.dto';

@UseGuards(JwtGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('subscribe')
  subscribe(@GetUser('id') userId: string, @Body() dto: PushSubscriptionDto) {
    return this.notificationsService.subscribe(userId, dto);
  }
}
