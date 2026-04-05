import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RegisterFcmTokenDto } from './dto/send-notification.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * POST /notifications/token
   * Register a device FCM token for the authenticated user.
   * Any authenticated role may call this endpoint.
   */
  @Post('token')
  @HttpCode(HttpStatus.CREATED)
  async registerToken(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterFcmTokenDto,
  ) {
    const fcmToken = await this.notificationsService.registerToken(
      user.sub,
      dto.token,
      dto.deviceType,
    );
    return {
      id: fcmToken.id,
      deviceType: fcmToken.deviceType,
      createdAt: fcmToken.createdAt,
    };
  }
}
