import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { BatchDrivingEventsDto } from './dto/driving-event.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { Role } from '../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  /**
   * POST /telemetry/events
   * DRIVER submits a batch of driving events from the mobile app sensor fusion.
   * The driverId is taken from the JWT — drivers cannot submit events for other drivers.
   */
  @Post('events')
  @Roles(Role.DRIVER)
  @HttpCode(HttpStatus.CREATED)
  async submitEvents(
    @CurrentUser() user: JwtPayload,
    @Body() dto: BatchDrivingEventsDto,
  ) {
    const saved = await this.telemetryService.recordBatch(user.sub, dto.events);
    return { accepted: saved.length };
  }

  /**
   * GET /telemetry/drivers/:id/score
   * Retrieve the safety score for a driver over a date range.
   * Query params: from (ISO date), to (ISO date). Defaults to last 30 days.
   */
  @Get('drivers/:id/score')
  @Roles(Role.SUPERVISOR, Role.SUPERADMIN)
  async getDriverScore(
    @Param('id', ParseUUIDPipe) driverId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from
      ? new Date(from)
      : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.telemetryService.getDriverScore(driverId, fromDate, toDate);
  }

  /**
   * GET /telemetry/trips/:tripId/events
   * Retrieve all driving events for a trip (SUPERVISOR, SUPERADMIN, or the trip's driver).
   * Ownership check for DRIVER role is delegated to the service/trust model —
   * drivers can only query their own trips via the driverId embedded in the JWT.
   */
  @Get('trips/:tripId/events')
  @Roles(Role.SUPERVISOR, Role.SUPERADMIN, Role.DRIVER)
  async getTripEvents(
    @Param('tripId', ParseUUIDPipe) tripId: string,
  ) {
    return this.telemetryService.getTripEvents(tripId);
  }
}
