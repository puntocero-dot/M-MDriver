import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VoipService } from './voip.service';
import { InitiateCallDto } from './dto/initiate-call.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { Role } from '../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('voip')
export class VoipController {
  constructor(private readonly voipService: VoipService) {}

  /**
   * POST /voip/call/initiate
   * Initiate a masked proxy call between client and driver for the given trip.
   * Only the CLIENT or DRIVER of that trip can call this endpoint.
   * Authorization (trip ownership) is enforced inside the service.
   */
  @Post('call/initiate')
  @Roles(Role.CLIENT, Role.DRIVER)
  @HttpCode(HttpStatus.CREATED)
  async initiateCall(
    @CurrentUser() user: JwtPayload,
    @Body() dto: InitiateCallDto,
  ) {
    return this.voipService.maskCall(user, dto.tripId);
  }
}
